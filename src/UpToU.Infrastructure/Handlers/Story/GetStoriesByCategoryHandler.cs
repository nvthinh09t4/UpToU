using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class GetStoriesByCategoryHandler : IRequestHandler<GetStoriesByCategoryQuery, Result<List<StoryDto>>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public GetStoriesByCategoryHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<List<StoryDto>>> Handle(GetStoriesByCategoryQuery request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        var stories = await _db.Stories
            .AsNoTracking()
            .Include(s => s.Category)
            .Include(s => s.Tags)
            .Include(s => s.StoryDetails)
            .Where(s => s.CategoryId == request.CategoryId && s.IsPublish)
            .ToListAsync(ct);

        var storyIds = stories.Select(s => s.Id).ToList();

        var voteRows = await _db.StoryVotes
            .Where(v => storyIds.Contains(v.StoryId))
            .GroupBy(v => new { v.StoryId, v.VoteType })
            .Select(g => new { g.Key.StoryId, g.Key.VoteType, Count = g.Count() })
            .ToListAsync(ct);

        var voteLookup = voteRows
            .GroupBy(r => r.StoryId)
            .ToDictionary(
                g => g.Key,
                g => g.ToDictionary(r => r.VoteType, r => r.Count)
            );

        var userVoteLookup = userId is not null
            ? await _db.StoryVotes
                .Where(v => storyIds.Contains(v.StoryId) && v.UserId == userId)
                .ToDictionaryAsync(v => v.StoryId, v => v.VoteType, ct)
            : [];

        var bookmarkedIds = userId is not null
            ? (await _db.Bookmarks
                .Where(b => storyIds.Contains(b.StoryId) && b.UserId == userId)
                .Select(b => b.StoryId)
                .ToListAsync(ct)).ToHashSet()
            : [];

        int UpCount(int id) => voteLookup.TryGetValue(id, out var d) && d.TryGetValue("Up", out var c) ? c : 0;
        int DownCount(int id) => voteLookup.TryGetValue(id, out var d) && d.TryGetValue("Down", out var c) ? c : 0;
        string? UserVote(int id) => userVoteLookup.TryGetValue(id, out var v) ? v : null;

        var sorted = request.SortBy switch
        {
            "Oldest"        => stories.OrderBy(s => s.PublishDate).ToList(),
            "MostUpvoted"   => stories.OrderByDescending(s => UpCount(s.Id)).ThenByDescending(s => s.PublishDate).ToList(),
            "MostDownvoted" => stories.OrderByDescending(s => DownCount(s.Id)).ThenByDescending(s => s.PublishDate).ToList(),
            "MostViewed"    => stories.OrderByDescending(s => s.ViewCount).ThenByDescending(s => s.PublishDate).ToList(),
            _               => stories.OrderByDescending(s => s.IsFeatured).ThenByDescending(s => s.PublishDate).ToList(),
        };

        return Result<List<StoryDto>>.Success(
            sorted.Select(s => StoryMapper.MapToDto(s,
                publishedRevisionOnly: true,
                upvoteCount: UpCount(s.Id),
                downvoteCount: DownCount(s.Id),
                currentUserVote: UserVote(s.Id),
                isBookmarked: bookmarkedIds.Contains(s.Id))).ToList()
        );
    }
}
