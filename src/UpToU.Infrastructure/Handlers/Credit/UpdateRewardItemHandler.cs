using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Credit;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Credit;

public class UpdateRewardItemHandler : IRequestHandler<UpdateRewardItemCommand, Result<AdminRewardItemDto>>
{
    private readonly ApplicationDbContext _db;
    public UpdateRewardItemHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<AdminRewardItemDto>> Handle(UpdateRewardItemCommand request, CancellationToken ct)
    {
        var item = await _db.RewardItems
            .Include(r => r.UserRewards)
            .FirstOrDefaultAsync(r => r.Id == request.Id, ct);
        if (item is null) return Result<AdminRewardItemDto>.NotFound("Reward item not found.");

        item.Name        = request.Name;
        item.Description = request.Description;
        item.Category    = request.Category;
        item.CreditCost  = request.CreditCost;
        item.Value       = request.Value;
        item.PreviewUrl  = request.PreviewUrl;
        item.IsActive    = request.IsActive;

        await _db.SaveChangesAsync(ct);

        return Result<AdminRewardItemDto>.Success(new AdminRewardItemDto(
            item.Id, item.Name, item.Description, item.Category, item.CreditCost,
            item.Value, item.PreviewUrl, item.IsActive, item.UserRewards.Count, item.CreatedAt));
    }
}
