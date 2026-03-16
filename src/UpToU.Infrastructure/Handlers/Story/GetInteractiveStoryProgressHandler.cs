using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Extensions;

namespace UpToU.Infrastructure.Handlers.Story;

public class GetInteractiveStoryProgressHandler : IRequestHandler<GetInteractiveStoryProgressQuery, Result<InteractiveStoryStateDto?>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<GetInteractiveStoryProgressHandler> _logger;

    public GetInteractiveStoryProgressHandler(
        ApplicationDbContext db,
        IHttpContextAccessor httpContextAccessor,
        ILogger<GetInteractiveStoryProgressHandler> logger)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<Result<InteractiveStoryStateDto?>> Handle(GetInteractiveStoryProgressQuery request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Result<InteractiveStoryStateDto?>.Unauthorized("Authentication required.");

        var progress = await _db.UserStoryProgresses
            .Where(p => p.UserId == userId && p.StoryId == request.StoryId)
            .FirstOrDefaultAsync(ct);

        if (progress is null)
            return Result<InteractiveStoryStateDto?>.Success(null);

        var scoreTypes = await _db.Stories.AsNoTracking()
            .Where(s => s.Id == progress.StoryId)
            .SelectMany(s => s.Category.ScoreTypes)
            .OrderBy(st => st.OrderToShow)
            .Select(st => new CategoryScoreTypeDto(st.Id, st.Name, st.Label, st.ScoreWeight, st.OrderToShow))
            .ToListAsync(ct);

        var categoryId = await _db.Stories.AsNoTracking()
            .Where(s => s.Id == progress.StoryId)
            .Select(s => s.CategoryId)
            .FirstOrDefaultAsync(ct);

        _logger.LogDebug(
            "Fetched interactive story progress. {UserId} {StoryId} {ProgressId} IsCompleted={IsCompleted}",
            userId, request.StoryId, progress.Id, progress.IsCompleted);

        var state = await InteractiveStoryHelpers.BuildStateAsync(_db, progress, categoryId, null, ct);
        return Result<InteractiveStoryStateDto?>.Success(state);
    }
}
