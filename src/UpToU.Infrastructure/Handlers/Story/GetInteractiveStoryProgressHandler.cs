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

public class GetInteractiveStoryProgressHandler : IRequestHandler<GetInteractiveStoryProgressQuery, Result<InteractiveStoryStateDto?>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public GetInteractiveStoryProgressHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<InteractiveStoryStateDto?>> Handle(GetInteractiveStoryProgressQuery request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Result<InteractiveStoryStateDto?>.Unauthorized("Authentication required.");

        var progress = await _db.UserStoryProgresses
            .Where(p => p.UserId == userId && p.StoryId == request.StoryId)
            .FirstOrDefaultAsync(ct);

        if (progress is null)
            return Result<InteractiveStoryStateDto?>.Success(null);

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

        var state = new InteractiveStoryStateDto(
            progress.Id,
            progress.StoryId,
            progress.StoryDetailId,
            progress.IsCompleted,
            progress.TotalPointsEarned,
            currentNodeDto,
            visitedCount);

        return Result<InteractiveStoryStateDto?>.Success(state);
    }
}
