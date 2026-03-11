using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Credit;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Credit;

public class DeleteRewardItemHandler : IRequestHandler<DeleteRewardItemCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;
    public DeleteRewardItemHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<bool>> Handle(DeleteRewardItemCommand request, CancellationToken ct)
    {
        var purchased = await _db.UserRewards.AnyAsync(ur => ur.RewardItemId == request.Id, ct);
        if (purchased)
            return Result<bool>.Conflict("Cannot delete an item that has been purchased. Disable it instead.");

        var deleted = await _db.RewardItems
            .Where(r => r.Id == request.Id)
            .ExecuteDeleteAsync(ct);

        return deleted > 0
            ? Result<bool>.Success(true)
            : Result<bool>.NotFound("Reward item not found.");
    }
}
