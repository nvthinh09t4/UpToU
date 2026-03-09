using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Reaction;
using UpToU.Core.DTOs.Reaction;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;
using ReactionEntity = UpToU.Core.Entities.Reaction;

namespace UpToU.Infrastructure.Handlers.Reaction;

public class UpsertReactionHandler : IRequestHandler<UpsertReactionCommand, Result<ReactionSummaryDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UpsertReactionHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<ReactionSummaryDto>> Handle(UpsertReactionCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<ReactionSummaryDto>.Unauthorized("Authentication required.");

        var validTypes = new[] { "Like", "Love", "Laugh" };
        if (!validTypes.Contains(request.ReactionType))
            return Result<ReactionSummaryDto>.Failure($"Invalid reaction type. Must be one of: {string.Join(", ", validTypes)}");

        var existing = await _db.Reactions
            .FirstOrDefaultAsync(r => r.StoryId == request.StoryId && r.UserId == userId, ct);

        if (existing is not null)
        {
            if (existing.ReactionType == request.ReactionType)
                _db.Reactions.Remove(existing); // toggle off
            else
                existing.ReactionType = request.ReactionType; // replace
        }
        else
        {
            _db.Reactions.Add(new ReactionEntity
            {
                StoryId = request.StoryId,
                UserId = userId,
                ReactionType = request.ReactionType,
                CreatedAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync(ct);

        // Return updated summary
        var reactions = await _db.Reactions
            .AsNoTracking()
            .Where(r => r.StoryId == request.StoryId)
            .ToListAsync(ct);

        var currentUserReaction = reactions.FirstOrDefault(r => r.UserId == userId)?.ReactionType;
        return Result<ReactionSummaryDto>.Success(new ReactionSummaryDto(
            reactions.Count(r => r.ReactionType == "Like"),
            reactions.Count(r => r.ReactionType == "Love"),
            reactions.Count(r => r.ReactionType == "Laugh"),
            currentUserReaction
        ));
    }
}
