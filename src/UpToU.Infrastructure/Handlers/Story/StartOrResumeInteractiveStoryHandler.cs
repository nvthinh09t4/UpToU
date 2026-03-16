using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Extensions;

namespace UpToU.Infrastructure.Handlers.Story;

public class StartOrResumeInteractiveStoryHandler : IRequestHandler<StartOrResumeInteractiveStoryCommand, Result<InteractiveStoryStateDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<StartOrResumeInteractiveStoryHandler> _logger;

    public StartOrResumeInteractiveStoryHandler(
        ApplicationDbContext db,
        IHttpContextAccessor httpContextAccessor,
        ILogger<StartOrResumeInteractiveStoryHandler> logger)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<Result<InteractiveStoryStateDto>> Handle(StartOrResumeInteractiveStoryCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Result<InteractiveStoryStateDto>.Unauthorized("Authentication required.");

        var story = await _db.Stories.AsNoTracking()
            .Where(s => s.Id == request.StoryId)
            .Select(s => new { s.Id, s.StoryType, s.IsPublish, s.CategoryId })
            .FirstOrDefaultAsync(ct);

        if (story is null)
            return Result<InteractiveStoryStateDto>.NotFound("Story not found.");
        if (story.StoryType != StoryTypes.Interactive)
            return Result<InteractiveStoryStateDto>.Failure("This story is not interactive.");
        if (!story.IsPublish)
            return Result<InteractiveStoryStateDto>.Failure("This story is not published.");

        var existing = await _db.UserStoryProgresses
            .Where(p => p.UserId == userId && p.StoryId == request.StoryId)
            .FirstOrDefaultAsync(ct);

        if (existing is not null)
        {
            _logger.LogDebug("Resuming interactive story. {UserId} {StoryId} {ProgressId}", userId, request.StoryId, existing.Id);
            return Result<InteractiveStoryStateDto>.Success(
                await InteractiveStoryHelpers.BuildStateAsync(_db, existing, story.CategoryId, null, ct));
        }

        var detailId = await FindActiveDetailIdAsync(request.StoryId, ct);
        if (detailId is null)
            return Result<InteractiveStoryStateDto>.NotFound("No published story revision is currently active.");

        var startNodeId = await FindStartNodeIdAsync(detailId.Value, ct);
        if (startNodeId is null)
            return Result<InteractiveStoryStateDto>.NotFound("This story has no start node configured.");

        var progress = await CreateProgressAsync(userId, request.StoryId, detailId.Value, startNodeId.Value, ct);

        _logger.LogInformation(
            "Interactive story started. {UserId} {StoryId} {ProgressId} {StartNodeId}",
            userId, request.StoryId, progress.Id, startNodeId.Value);

        return Result<InteractiveStoryStateDto>.Success(
            await InteractiveStoryHelpers.BuildStateAsync(_db, progress, story.CategoryId, null, ct));
    }

    private async Task<int?> FindActiveDetailIdAsync(int storyId, CancellationToken ct)
    {
        var now    = DateTime.UtcNow;
        var detail = await _db.StoryDetails.AsNoTracking()
            .Where(d => d.StoryId == storyId && d.IsPublish
                && (d.EffectiveDate == null || d.EffectiveDate <= now))
            .OrderByDescending(d => d.EffectiveDate)
            .ThenByDescending(d => d.Revision)
            .Select(d => new { d.Id })
            .FirstOrDefaultAsync(ct);

        return detail?.Id;
    }

    private async Task<int?> FindStartNodeIdAsync(int detailId, CancellationToken ct)
    {
        var node = await _db.StoryNodes.AsNoTracking()
            .Where(n => n.StoryDetailId == detailId && n.IsStart)
            .Select(n => new { n.Id })
            .FirstOrDefaultAsync(ct);

        return node?.Id;
    }

    private async Task<UserStoryProgress> CreateProgressAsync(
        string userId, int storyId, int detailId, int startNodeId, CancellationToken ct)
    {
        var progress = new UserStoryProgress
        {
            UserId        = userId,
            StoryId       = storyId,
            StoryDetailId = detailId,
            CurrentNodeId = startNodeId,
            IsCompleted   = false,
            StartedAt     = DateTime.UtcNow,
            UpdatedAt     = DateTime.UtcNow,
        };
        _db.UserStoryProgresses.Add(progress);
        await _db.SaveChangesAsync(ct);
        return progress;
    }
}
