using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class GetBookmarksHandler : IRequestHandler<GetBookmarksQuery, Result<List<StoryDto>>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public GetBookmarksHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<List<StoryDto>>> Handle(GetBookmarksQuery request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<List<StoryDto>>.Unauthorized("Authentication required.");

        var stories = await _db.Bookmarks
            .AsNoTracking()
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => b.Story)
            .Include(s => s.Category)
            .Include(s => s.Tags)
            .Include(s => s.StoryDetails)
            .ToListAsync(ct);

        var storyIds = stories.Select(s => s.Id).ToList();

        var voteRows = await _db.StoryVotes
            .Where(v => storyIds.Contains(v.StoryId))
            .GroupBy(v => new { v.StoryId, v.VoteType })
            .Select(g => new { g.Key.StoryId, g.Key.VoteType, Count = g.Count() })
            .ToListAsync(ct);

        var voteLookup = voteRows
            .GroupBy(r => r.StoryId)
            .ToDictionary(g => g.Key, g => g.ToDictionary(r => r.VoteType, r => r.Count));

        var userVoteLookup = await _db.StoryVotes
            .Where(v => storyIds.Contains(v.StoryId) && v.UserId == userId)
            .ToDictionaryAsync(v => v.StoryId, v => v.VoteType, ct);

        int UpCount(int id) => voteLookup.TryGetValue(id, out var d) && d.TryGetValue("Up", out var c) ? c : 0;
        int DownCount(int id) => voteLookup.TryGetValue(id, out var d) && d.TryGetValue("Down", out var c) ? c : 0;
        string? UserVote(int id) => userVoteLookup.TryGetValue(id, out var v) ? v : null;

        return Result<List<StoryDto>>.Success(
            stories.Select(s => StoryMapper.MapToDto(s,
                publishedRevisionOnly: true,
                upvoteCount: UpCount(s.Id),
                downvoteCount: DownCount(s.Id),
                currentUserVote: UserVote(s.Id),
                isBookmarked: true)).ToList()
        );
    }
}
