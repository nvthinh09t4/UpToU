using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class GetStoryByIdHandler : IRequestHandler<GetStoryByIdQuery, Result<StoryDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public GetStoryByIdHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<StoryDto>> Handle(GetStoryByIdQuery request, CancellationToken ct)
    {
        var story = await _db.Stories
            .AsNoTracking()
            .Include(s => s.Category)
            .Include(s => s.Tags)
            .Include(s => s.StoryDetails)
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.IsPublish, ct);

        if (story is null)
            return Result<StoryDto>.NotFound("Story not found.");

        // Increment view count
        await _db.Stories
            .Where(s => s.Id == request.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.ViewCount, x => x.ViewCount + 1), ct);

        story.ViewCount += 1;

        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        var voteCounts = await _db.StoryVotes
            .Where(v => v.StoryId == request.Id)
            .GroupBy(v => v.VoteType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var upvotes = voteCounts.FirstOrDefault(v => v.Type == "Up")?.Count ?? 0;
        var downvotes = voteCounts.FirstOrDefault(v => v.Type == "Down")?.Count ?? 0;

        var currentUserVote = userId is not null
            ? await _db.StoryVotes
                .Where(v => v.StoryId == request.Id && v.UserId == userId)
                .Select(v => v.VoteType)
                .FirstOrDefaultAsync(ct)
            : null;

        return Result<StoryDto>.Success(StoryMapper.MapToDto(story,
            publishedRevisionOnly: true,
            upvoteCount: upvotes,
            downvoteCount: downvotes,
            currentUserVote: currentUserVote));
    }
}
