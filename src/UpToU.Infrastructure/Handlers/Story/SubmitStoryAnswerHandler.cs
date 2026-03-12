using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class SubmitStoryAnswerHandler : IRequestHandler<SubmitStoryAnswerCommand, Result<InteractiveStoryStateDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public SubmitStoryAnswerHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<InteractiveStoryStateDto>> Handle(SubmitStoryAnswerCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Result<InteractiveStoryStateDto>.Unauthorized("Authentication required.");

        // Load progress and verify ownership
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
            return Result<InteractiveStoryStateDto>.Failure("Story is in an invalid state — no current node.");

        // Load the chosen answer and verify it belongs to the current node
        var answer = await _db.StoryNodeAnswers.AsNoTracking()
            .Where(a => a.Id == request.AnswerId)
            .Select(a => new { a.Id, a.StoryNodeId, a.PointsAwarded, a.NextNodeId })
            .FirstOrDefaultAsync(ct);

        if (answer is null)
            return Result<InteractiveStoryStateDto>.NotFound("Answer not found.");
        if (answer.StoryNodeId != progress.CurrentNodeId.Value)
            return Result<InteractiveStoryStateDto>.Failure("The selected answer does not belong to the current node.");

        // Record the answer
        var userAnswer = new UserStoryAnswer
        {
            ProgressId    = progress.Id,
            NodeId        = progress.CurrentNodeId.Value,
            AnswerId      = answer.Id,
            PointsAwarded = answer.PointsAwarded,
            AnsweredAt    = DateTime.UtcNow,
        };
        _db.UserStoryAnswers.Add(userAnswer);

        progress.TotalPointsEarned += answer.PointsAwarded;
        progress.UpdatedAt          = DateTime.UtcNow;

        if (answer.NextNodeId is null)
        {
            // ── Story complete ────────────────────────────────────────────────
            progress.IsCompleted   = true;
            progress.CurrentNodeId = null;
            progress.CompletedAt   = DateTime.UtcNow;

            // Load story metadata once for both the credit and contributed-point logic
            var story = await _db.Stories.AsNoTracking()
                .Where(s => s.Id == progress.StoryId)
                .Select(s => new { s.Title, s.CategoryId, s.AuthorId })
                .FirstOrDefaultAsync(ct);

            // Award reader credits for completing the interactive story
            _db.CreditTransactions.Add(new CreditTransaction
            {
                UserId      = userId,
                Amount      = progress.TotalPointsEarned,
                Type        = "StoryComplete",
                ReferenceId = progress.StoryId,
                CategoryId  = story?.CategoryId,
                Description = $"Completed: {story?.Title ?? "Unknown Story"}",
                CreatedAt   = DateTime.UtcNow,
            });

            // Award a contributed point to the story's author (skip self-reads)
            if (story?.AuthorId is { } authorId && authorId != userId)
            {
                var alreadyAwarded = await _db.ContributedPointTransactions
                    .AnyAsync(t => t.StoryId == progress.StoryId && t.ReaderId == userId, ct);

                if (!alreadyAwarded)
                {
                    _db.ContributedPointTransactions.Add(new ContributedPointTransaction
                    {
                        AuthorId  = authorId,
                        ReaderId  = userId,
                        StoryId   = progress.StoryId,
                        Points    = 1,
                        CreatedAt = DateTime.UtcNow,
                    });

                    // Increment the cached counter on the author's profile row
                    await _db.Users
                        .Where(u => u.Id == authorId)
                        .ExecuteUpdateAsync(
                            s => s.SetProperty(u => u.ContributedPoints, u => u.ContributedPoints + 1), ct);
                }
            }
        }
        else
        {
            progress.CurrentNodeId = answer.NextNodeId;
        }

        await _db.SaveChangesAsync(ct);

        return Result<InteractiveStoryStateDto>.Success(await BuildState(progress, ct));
    }

    private async Task<InteractiveStoryStateDto> BuildState(UserStoryProgress progress, CancellationToken ct)
    {
        StoryNodeDto? currentNodeDto = null;
        if (progress.CurrentNodeId.HasValue)
        {
            currentNodeDto = await _db.StoryNodes.AsNoTracking()
                .Where(n => n.Id == progress.CurrentNodeId.Value)
                .Select(n => new StoryNodeDto(
                    n.Id, n.StoryDetailId, n.Question, n.QuestionSubtitle, n.IsStart,
                    n.BackgroundImageUrl, n.BackgroundColor, n.VideoUrl, n.AnimationType, n.SortOrder,
                    n.Answers.OrderBy(a => a.SortOrder).ThenBy(a => a.Id)
                        .Select(a => new StoryNodeAnswerDto(a.Id, a.Text, a.PointsAwarded, a.NextNodeId, a.Color, a.SortOrder))
                        .ToList()))
                .FirstOrDefaultAsync(ct);
        }

        var visitedCount = await _db.UserStoryAnswers.CountAsync(a => a.ProgressId == progress.Id, ct);

        return new InteractiveStoryStateDto(
            progress.Id,
            progress.StoryId,
            progress.StoryDetailId,
            progress.IsCompleted,
            progress.TotalPointsEarned,
            currentNodeDto,
            visitedCount);
    }
}
