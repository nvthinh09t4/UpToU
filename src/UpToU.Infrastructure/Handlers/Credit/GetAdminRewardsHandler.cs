using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Credit;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Credit;

public class GetAdminRewardsHandler : IRequestHandler<GetAdminRewardsQuery, Result<List<AdminRewardItemDto>>>
{
    private readonly ApplicationDbContext _db;
    public GetAdminRewardsHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<AdminRewardItemDto>>> Handle(GetAdminRewardsQuery request, CancellationToken ct)
    {
        var query = _db.RewardItems.AsNoTracking();
        if (!string.IsNullOrEmpty(request.Category))
            query = query.Where(r => r.Category == request.Category);

        var items = await query
            .OrderBy(r => r.Category).ThenBy(r => r.CreditCost)
            .Select(r => new AdminRewardItemDto(
                r.Id, r.Name, r.Description, r.Category, r.CreditCost,
                r.Value, r.PreviewUrl, r.IsActive,
                r.UserRewards.Count,
                r.CreatedAt))
            .ToListAsync(ct);

        return Result<List<AdminRewardItemDto>>.Success(items);
    }
}
