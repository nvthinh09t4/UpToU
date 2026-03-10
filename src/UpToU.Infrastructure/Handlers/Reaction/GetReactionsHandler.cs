using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Reaction;
using UpToU.Core.DTOs.Reaction;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Reaction;

public class GetReactionsHandler : IRequestHandler<GetReactionsQuery, Result<ReactionSummaryDto>>
{
    private readonly ApplicationDbContext _db;

    public GetReactionsHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<ReactionSummaryDto>> Handle(GetReactionsQuery request, CancellationToken ct)
    {
        var reactions = await _db.Reactions
            .AsNoTracking()
            .Where(r => r.StoryId == request.StoryId)
            .ToListAsync(ct);

        var likeCount = reactions.Count(r => r.ReactionType == "Like");
        var loveCount = reactions.Count(r => r.ReactionType == "Love");
        var laughCount = reactions.Count(r => r.ReactionType == "Laugh");
        var currentUserReaction = request.CurrentUserId is not null
            ? reactions.FirstOrDefault(r => r.UserId == request.CurrentUserId)?.ReactionType
            : null;

        return Result<ReactionSummaryDto>.Success(new ReactionSummaryDto(likeCount, loveCount, laughCount, currentUserReaction));
    }
}
