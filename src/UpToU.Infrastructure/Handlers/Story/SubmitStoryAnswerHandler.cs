using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Core.AI;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Interfaces;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Extensions;
using UpToU.Infrastructure.Services;

namespace UpToU.Infrastructure.Handlers.Story;

public class SubmitStoryAnswerHandler : IRequestHandler<SubmitStoryAnswerCommand, Result<InteractiveStoryStateDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IStoryBehaviorEvaluator _behaviorEvaluator;
    private readonly IBadgeAwardService _badgeAwardService;
    private readonly ILogger<SubmitStoryAnswerHandler> _logger;

    public SubmitStoryAnswerHandler(
        ApplicationDbContext db,
        IHttpContextAccessor httpContextAccessor,
        IStoryBehaviorEvaluator behaviorEvaluator,
        IBadgeAwardService badgeAwardService,
        ILogger<SubmitStoryAnswerHandler> logger)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
        _behaviorEvaluator = behaviorEvaluator;
        _badgeAwardService = badgeAwardService;
        _logger = logger;
    }

    public async Task<Result<InteractiveStoryStateDto>> Handle(SubmitStoryAnswerCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Result<InteractiveStoryStateDto>.Unauthorized("Authentication required.");

        var progress = await _db.UserStoryProgresses
            .Where(p => p.Id == request.ProgressId)
            .FirstOrDefaultAsync(ct);

        if (progress is null)
            return Result<InteractiveStoryStateDto>.NotFound("Progress record not found.");
        if (progress.UserId != userId)
            return Result<InteractiveStoryStateDto>.Unauthorized("Access denied.");
        if (progress.IsCompleted)
            return Result<InteractiveStoryStateDto>.Failure("This story has already been completed.");
        if (progress.CurrentNodeId is null)
            return Result<InteractiveStoryStateDto>.Failure("Story is in an invalid state - no current node.");

        var answer = await LoadAnswerAsync(request.AnswerId, ct);
        if (answer is null)
            return Result<InteractiveStoryStateDto>.NotFound("Answer not found.");
        if (answer.StoryNodeId != progress.CurrentNodeId.Value)
            return Result<InteractiveStoryStateDto>.Failure("The selected answer does not belong to the current node.");

        var story = await LoadStoryMetaAsync(progress.StoryId, ct);

        ApplyScoreDeltas(progress, answer.ScoreDeltas);
        RecordAnswer(progress, answer);

        var answeredCount = await _db.UserStoryAnswers.CountAsync(a => a.ProgressId == progress.Id, ct) + 1;
        var resolvedNextNodeId = await ResolveNextNodeAsync(progress, answer, userId, ct);
        var isEnd = IsStoryEnd(story, progress, answeredCount, resolvedNextNodeId);

        if (isEnd)
            await HandleStoryCompletionAsync(progress, story, userId, ct);
        else
            progress.CurrentNodeId = resolvedNextNodeId;

        await _db.SaveChangesAsync(ct);

        await _db.StoryNodeAnswers
            .Where(a => a.Id == request.AnswerId)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.ChoiceCount, a => a.ChoiceCount + 1), ct);

        var feedbackDto = await BuildFeedbackDtoAsync(answer, request.AnswerId, ct);

        _logger.LogDebug(
            "Answer submitted. {UserId} {ProgressId} {AnswerId} {PointsAwarded} IsEnd={IsEnd}",
            userId, progress.Id, answer.Id, answer.PointsAwarded, isEnd);

        return Result<InteractiveStoryStateDto>.Success(
            await InteractiveStoryHelpers.BuildStateAsync(_db, progress, story?.CategoryId ?? 0, feedbackDto, ct));
    }

    private async Task<AnswerData?> LoadAnswerAsync(int answerId, CancellationToken ct)
        => await _db.StoryNodeAnswers.AsNoTracking()
            .Where(a => a.Id == answerId)
            .Select(a => new AnswerData(
                a.Id, a.StoryNodeId, a.PointsAwarded, a.NextNodeId,
                a.ScoreDeltas, a.Feedback, a.FeedbackVi, a.BranchWeights))
            .FirstOrDefaultAsync(ct);

    private async Task<StoryMeta?> LoadStoryMetaAsync(int storyId, CancellationToken ct)
        => await _db.Stories.AsNoTracking()
            .Where(s => s.Id == storyId)
            .Select(s => new StoryMeta(
                s.Title, s.CategoryId, s.AuthorId,
                s.MaxScoreValue, s.MaxQuestionLimit,
                s.MaxScoreType != null ? s.MaxScoreType.Name : null))
            .FirstOrDefaultAsync(ct);

    private void ApplyScoreDeltas(UserStoryProgress progress, Dictionary<string, int> deltas)
    {
        foreach (var (key, delta) in deltas)
        {
            progress.ScoreTotals[key] = progress.ScoreTotals.TryGetValue(key, out var current)
                ? current + delta
                : delta;
        }
        _db.Entry(progress).Property(p => p.ScoreTotals).IsModified = true;
    }

    private void RecordAnswer(UserStoryProgress progress, AnswerData answer)
    {
        _db.UserStoryAnswers.Add(new UserStoryAnswer
        {
            ProgressId    = progress.Id,
            NodeId        = progress.CurrentNodeId!.Value,
            AnswerId      = answer.Id,
            PointsAwarded = answer.PointsAwarded,
            ScoreDeltas   = answer.ScoreDeltas,
            AnsweredAt    = DateTime.UtcNow,
        });
        progress.TotalPointsEarned += answer.PointsAwarded;
        progress.UpdatedAt          = DateTime.UtcNow;
    }

    private async Task<int?> ResolveNextNodeAsync(
        UserStoryProgress progress, AnswerData answer, string userId, CancellationToken ct)
    {
        var resolved = ResolveByBranchWeights(answer.BranchWeights) ?? answer.NextNodeId;

        var behaviorContext = new PlayerBehaviorContext(
            userId, progress.StoryId, progress.Id,
            progress.CurrentNodeId!.Value, answer.Id,
            progress.ScoreTotals, new List<PlayerDecision>());

        var aiOverride = await _behaviorEvaluator.SelectNextNodeAsync(behaviorContext, ct);
        return aiOverride ?? resolved;
    }

    private static int? ResolveByBranchWeights(Dictionary<string, int> weights)
    {
        if (weights.Count == 0) return null;

        var totalWeight = weights.Values.Sum();
        var roll        = Random.Shared.Next(totalWeight);
        var cumulative  = 0;

        foreach (var (nodeIdStr, weight) in weights)
        {
            cumulative += weight;
            if (roll < cumulative)
                return int.TryParse(nodeIdStr, out var id) ? id : null;
        }
        return null;
    }

    private static bool IsStoryEnd(StoryMeta? story, UserStoryProgress progress, int answeredCount, int? nextNodeId)
    {
        var scoreGateMet = story?.MaxScoreTypeName is not null
            && story.MaxScoreValue.HasValue
            && progress.ScoreTotals.TryGetValue(story.MaxScoreTypeName, out var score)
            && score >= story.MaxScoreValue.Value;

        var questionLimitMet = story?.MaxQuestionLimit.HasValue == true
            && answeredCount >= story.MaxQuestionLimit!.Value;

        return nextNodeId is null || scoreGateMet || questionLimitMet;
    }

    private async Task HandleStoryCompletionAsync(
        UserStoryProgress progress, StoryMeta? story, string userId, CancellationToken ct)
    {
        progress.IsCompleted   = true;
        progress.CurrentNodeId = null;
        progress.CompletedAt   = DateTime.UtcNow;

        var scoreTypes    = await _db.CategoryScoreTypes.AsNoTracking()
            .Where(st => st.CategoryId == story!.CategoryId)
            .ToListAsync(ct);
        var categoryScore = CategoryScoreCalculator.ComputeCategoryScore(progress.ScoreTotals, scoreTypes);
        var creditAmount  = (int)Math.Round(categoryScore);

        _db.CreditTransactions.Add(new CreditTransaction
        {
            UserId      = userId,
            Amount      = creditAmount,
            Type        = CreditTransactionTypes.StoryComplete,
            ReferenceId = progress.StoryId,
            CategoryId  = story?.CategoryId,
            Description = $"Completed: {story?.Title ?? "Unknown Story"}",
            CreatedAt   = DateTime.UtcNow,
        });

        await _badgeAwardService.AwardEligibleBadgesAsync(userId, story!.CategoryId, creditAmount, ct);
        await AwardContributedPointAsync(progress.StoryId, story?.AuthorId, userId, ct);
        await UpdateStreakAsync(userId, ct);

        _logger.LogInformation(
            "Interactive story completed. {UserId} {StoryId} {ProgressId} {CategoryScore} {CreditsAwarded}",
            userId, progress.StoryId, progress.Id, categoryScore, creditAmount);
    }

    private async Task AwardContributedPointAsync(int storyId, string? authorId, string userId, CancellationToken ct)
    {
        if (authorId is null || authorId == userId) return;

        var alreadyAwarded = await _db.ContributedPointTransactions
            .AnyAsync(t => t.StoryId == storyId && t.ReaderId == userId, ct);

        if (alreadyAwarded) return;

        _db.ContributedPointTransactions.Add(new ContributedPointTransaction
        {
            AuthorId  = authorId,
            ReaderId  = userId,
            StoryId   = storyId,
            Points    = 1,
            CreatedAt = DateTime.UtcNow,
        });

        await _db.Users
            .Where(u => u.Id == authorId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.ContributedPoints, u => u.ContributedPoints + 1), ct);

        _logger.LogInformation(
            "Contributed point awarded. {AuthorId} {ReaderId} {StoryId}",
            authorId, userId, storyId);
    }

    private async Task<AnswerFeedbackDto> BuildFeedbackDtoAsync(
        AnswerData answer, int requestAnswerId, CancellationToken ct)
    {
        var choiceStats = await _db.StoryNodeAnswers.AsNoTracking()
            .Where(a => a.StoryNodeId == answer.StoryNodeId)
            .Select(a => new { a.Id, a.ChoiceCount })
            .ToListAsync(ct);

        var myChoiceCount = choiceStats.FirstOrDefault(s => s.Id == requestAnswerId)?.ChoiceCount ?? 1;
        var totalChoices  = choiceStats.Sum(s => s.ChoiceCount);

        return new AnswerFeedbackDto(
            answer.Id,
            answer.ScoreDeltas,
            answer.ScoreDeltas.Values.Sum(),
            answer.Feedback,
            answer.FeedbackVi,
            myChoiceCount,
            totalChoices);
    }

    private static readonly int[] StreakMilestones = [3, 7, 30];
    private static readonly Dictionary<int, int> MilestoneCredits = new() { [3] = 30, [7] = 75, [30] = 300 };

    private async Task UpdateStreakAsync(string userId, CancellationToken ct)
    {
        var streak = await _db.UserStreaks.FirstOrDefaultAsync(s => s.UserId == userId, ct);
        var today  = DateTime.UtcNow.Date;

        if (streak is null)
        {
            streak = new UserStreak
            {
                UserId                = userId,
                CurrentStreak         = 1,
                LongestStreak         = 1,
                LastCompletionDate    = DateTime.UtcNow,
                LastAwardedMilestone  = 0,
                UpdatedAt             = DateTime.UtcNow,
            };
            _db.UserStreaks.Add(streak);
        }
        else
        {
            var lastDate = streak.LastCompletionDate?.Date;
            if (lastDate == today)
            {
                return; // already updated today
            }
            else if (lastDate == today.AddDays(-1))
            {
                streak.CurrentStreak++;
            }
            else
            {
                streak.CurrentStreak = 1;
            }

            streak.LongestStreak      = Math.Max(streak.LongestStreak, streak.CurrentStreak);
            streak.LastCompletionDate = DateTime.UtcNow;
            streak.UpdatedAt          = DateTime.UtcNow;
        }

        // Award bonus credits for milestone crossings
        foreach (var milestone in StreakMilestones.Where(m => m <= streak.CurrentStreak && m > streak.LastAwardedMilestone))
        {
            var bonus = MilestoneCredits[milestone];
            _db.CreditTransactions.Add(new CreditTransaction
            {
                UserId      = userId,
                Amount      = bonus,
                Type        = CreditTransactionTypes.StreakBonus,
                Description = $"🔥 {milestone}-day streak bonus!",
                CreatedAt   = DateTime.UtcNow,
            });
            streak.LastAwardedMilestone = milestone;

            _logger.LogInformation("Streak milestone reached. {UserId} {Milestone} {Bonus}", userId, milestone, bonus);
        }
    }

    // ── Internal data models ────────────────────────────────────────────────

    private sealed record AnswerData(
        int Id, int StoryNodeId, int PointsAwarded, int? NextNodeId,
        Dictionary<string, int> ScoreDeltas, string? Feedback, string? FeedbackVi,
        Dictionary<string, int> BranchWeights);

    private sealed record StoryMeta(
        string Title, int CategoryId, string? AuthorId,
        int? MaxScoreValue, int? MaxQuestionLimit, string? MaxScoreTypeName);
}
