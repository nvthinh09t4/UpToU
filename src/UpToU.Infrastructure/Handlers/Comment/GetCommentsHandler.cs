using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Comment;
using UpToU.Core.DTOs.Comment;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Comment;

public class GetCommentsHandler : IRequestHandler<GetCommentsQuery, Result<List<CommentDto>>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public GetCommentsHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<List<CommentDto>>> Handle(GetCommentsQuery request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Load ALL comments for the story in one flat query (supports arbitrary nesting)
        var all = await _db.Comments
            .AsNoTracking()
            .Include(c => c.Author)
            .Where(c => c.StoryId == request.StoryId)
            .ToListAsync(ct);

        var allIds = all.Select(c => c.Id).ToList();

        var voteRows = await _db.CommentVotes
            .Where(v => allIds.Contains(v.CommentId))
            .GroupBy(v => new { v.CommentId, v.VoteType })
            .Select(g => new { g.Key.CommentId, g.Key.VoteType, Count = g.Count() })
            .ToListAsync(ct);

        // O(1) lookups using nested dictionary: commentId → voteType → count
        var voteLookup = voteRows
            .GroupBy(r => r.CommentId)
            .ToDictionary(
                g => g.Key,
                g => g.ToDictionary(r => r.VoteType, r => r.Count)
            );

        var userVoteLookup = userId is not null
            ? await _db.CommentVotes
                .Where(v => allIds.Contains(v.CommentId) && v.UserId == userId)
                .ToDictionaryAsync(v => v.CommentId, v => v.VoteType, ct)
            : [];

        int UpCount(int id) => voteLookup.TryGetValue(id, out var d) && d.TryGetValue("Up", out var c) ? c : 0;
        int DownCount(int id) => voteLookup.TryGetValue(id, out var d) && d.TryGetValue("Down", out var c) ? c : 0;
        string? UserVote(int id) => userVoteLookup.TryGetValue(id, out var v) ? v : null;

        // Build lookup: parentId → children (ToLookup handles nullable keys)
        var byParent = all
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.CreatedAt)
            .ToLookup(c => c.ParentCommentId);

        // Recursively build DTO tree starting from root comments
        CommentDto BuildDto(Core.Entities.Comment c)
        {
            var children = byParent[c.Id].Select(BuildDto).ToList();

            return new CommentDto(
                c.Id,
                c.StoryId,
                new CommentAuthorDto(c.Author.Id, $"{c.Author.FirstName} {c.Author.LastName}", c.Author.MentionHandle),
                c.Body,
                c.ParentCommentId,
                c.CreatedAt,
                c.EditedAt,
                children,
                UpCount(c.Id),
                DownCount(c.Id),
                UserVote(c.Id)
            );
        }

        var roots = byParent[null].ToList();

        var sorted = request.SortBy switch
        {
            "Oldest"        => roots.OrderBy(c => c.CreatedAt).ToList(),
            "MostUpvoted"   => roots.OrderByDescending(c => UpCount(c.Id)).ThenByDescending(c => c.CreatedAt).ToList(),
            "MostDownvoted" => roots.OrderByDescending(c => DownCount(c.Id)).ThenByDescending(c => c.CreatedAt).ToList(),
            _               => roots.OrderByDescending(c => c.CreatedAt).ToList(),
        };

        return Result<List<CommentDto>>.Success(sorted.Select(BuildDto).ToList());
    }
}
