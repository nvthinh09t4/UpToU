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

public class StartOrResumeInteractiveStoryHandler : IRequestHandler<StartOrResumeInteractiveStoryCommand, Result<InteractiveStoryStateDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public StartOrResumeInteractiveStoryHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<InteractiveStoryStateDto>> Handle(StartOrResumeInteractiveStoryCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Result<InteractiveStoryStateDto>.Unauthorized("Authentication required.");

        // Verify the story exists and is interactive
        var story = await _db.Stories.AsNoTracking()
            .Where(s => s.Id == request.StoryId)
            .Select(s => new { s.Id, s.StoryType, s.IsPublish, s.CategoryId })
            .FirstOrDefaultAsync(ct);

        if (story is null) return Result<InteractiveStoryStateDto>.NotFound("Story not found.");
        if (story.StoryType != "Interactive")
            return Result<InteractiveStoryStateDto>.Failure("This story is not interactive.");
        if (!story.IsPublish)
            return Result<InteractiveStoryStateDto>.Failure("This story is not published.");

        // Check for existing progress
        var existing = await _db.UserStoryProgresses
            .Where(p => p.UserId == userId && p.StoryId == request.StoryId)
            .FirstOrDefaultAsync(ct);

        if (existing is not null)
            return Result<InteractiveStoryStateDto>.Success(await BuildState(existing, ct));

        // Find active StoryDetail: IsPublish=true, EffectiveDate<=UTC_NOW or null, newest first
        var now = DateTime.UtcNow;
        var detail = await _db.StoryDetails.AsNoTracking()
            .Where(d => d.StoryId == request.StoryId && d.IsPublish
                && (d.EffectiveDate == null || d.EffectiveDate <= now))
            .OrderByDescending(d => d.EffectiveDate)
            .ThenByDescending(d => d.Revision)
            .Select(d => new { d.Id })
            .FirstOrDefaultAsync(ct);

        if (detail is null)
            return Result<InteractiveStoryStateDto>.NotFound("No published story revision is currently active.");

        // Find the start node for this detail
        var startNode = await _db.StoryNodes.AsNoTracking()
            .Where(n => n.StoryDetailId == detail.Id && n.IsStart)
            .Select(n => new { n.Id })
            .FirstOrDefaultAsync(ct);

        if (startNode is null)
            return Result<InteractiveStoryStateDto>.NotFound("This story has no start node configured.");

        // Create progress record
        var progress = new UserStoryProgress
        {
            UserId        = userId,
            StoryId       = request.StoryId,
            StoryDetailId = detail.Id,
            CurrentNodeId = startNode.Id,
            IsCompleted   = false,
            StartedAt     = DateTime.UtcNow,
            UpdatedAt     = DateTime.UtcNow,
        };
        _db.UserStoryProgresses.Add(progress);
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
