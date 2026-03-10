using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Comment;
using UpToU.Core.DTOs.Vote;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Comment;

public class VoteCommentHandler : IRequestHandler<VoteCommentCommand, Result<VoteResultDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public VoteCommentHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<VoteResultDto>> Handle(VoteCommentCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<VoteResultDto>.Unauthorized("Authentication required.");

        if (request.VoteType is not ("Up" or "Down"))
            return Result<VoteResultDto>.Failure("VoteType must be 'Up' or 'Down'.");

        if (!await _db.Comments.AnyAsync(c => c.Id == request.CommentId, ct))
            return Result<VoteResultDto>.NotFound("Comment not found.");

        var existing = await _db.CommentVotes
            .FirstOrDefaultAsync(v => v.CommentId == request.CommentId && v.UserId == userId, ct);

        if (existing is null)
        {
            _db.CommentVotes.Add(new CommentVote
            {
                CommentId = request.CommentId,
                UserId = userId,
                VoteType = request.VoteType,
                CreatedAt = DateTime.UtcNow,
            });
        }
        else if (existing.VoteType == request.VoteType)
        {
            _db.CommentVotes.Remove(existing);
        }
        else
        {
            existing.VoteType = request.VoteType;
        }

        await _db.SaveChangesAsync(ct);

        var counts = await _db.CommentVotes
            .Where(v => v.CommentId == request.CommentId)
            .GroupBy(v => v.VoteType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var upvotes = counts.FirstOrDefault(c => c.Type == "Up")?.Count ?? 0;
        var downvotes = counts.FirstOrDefault(c => c.Type == "Down")?.Count ?? 0;

        var currentVote = await _db.CommentVotes
            .Where(v => v.CommentId == request.CommentId && v.UserId == userId)
            .Select(v => v.VoteType)
            .FirstOrDefaultAsync(ct);

        return Result<VoteResultDto>.Success(new VoteResultDto(upvotes, downvotes, currentVote));
    }
}
