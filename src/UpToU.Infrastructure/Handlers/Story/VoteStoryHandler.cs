using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Vote;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class VoteStoryHandler : IRequestHandler<VoteStoryCommand, Result<VoteResultDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public VoteStoryHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<VoteResultDto>> Handle(VoteStoryCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<VoteResultDto>.Unauthorized("Authentication required.");

        if (request.VoteType is not ("Up" or "Down"))
            return Result<VoteResultDto>.Failure("VoteType must be 'Up' or 'Down'.");

        if (!await _db.Stories.AnyAsync(s => s.Id == request.StoryId, ct))
            return Result<VoteResultDto>.NotFound("Story not found.");

        var existing = await _db.StoryVotes
            .FirstOrDefaultAsync(v => v.StoryId == request.StoryId && v.UserId == userId, ct);

        if (existing is null)
        {
            _db.StoryVotes.Add(new StoryVote
            {
                StoryId = request.StoryId,
                UserId = userId,
                VoteType = request.VoteType,
                CreatedAt = DateTime.UtcNow,
            });
        }
        else if (existing.VoteType == request.VoteType)
        {
            // Same vote → toggle off
            _db.StoryVotes.Remove(existing);
        }
        else
        {
            // Different vote → change
            existing.VoteType = request.VoteType;
        }

        await _db.SaveChangesAsync(ct);

        var counts = await _db.StoryVotes
            .Where(v => v.StoryId == request.StoryId)
            .GroupBy(v => v.VoteType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var upvotes = counts.FirstOrDefault(c => c.Type == "Up")?.Count ?? 0;
        var downvotes = counts.FirstOrDefault(c => c.Type == "Down")?.Count ?? 0;

        var currentVote = await _db.StoryVotes
            .Where(v => v.StoryId == request.StoryId && v.UserId == userId)
            .Select(v => v.VoteType)
            .FirstOrDefaultAsync(ct);

        return Result<VoteResultDto>.Success(new VoteResultDto(upvotes, downvotes, currentVote));
    }
}
