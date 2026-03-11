using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Credit;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Credit;

public class GetRewardsHandler : IRequestHandler<GetRewardsQuery, Result<List<RewardItemDto>>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public GetRewardsHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<List<RewardItemDto>>> Handle(GetRewardsQuery request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        var query = _db.RewardItems.AsNoTracking().Where(r => r.IsActive);

        if (!string.IsNullOrEmpty(request.Category))
            query = query.Where(r => r.Category == request.Category);

        var unlockedIds = userId is not null
            ? await _db.UserRewards.AsNoTracking()
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.RewardItemId)
                .ToListAsync(ct)
            : new List<int>();

        var activeIds = userId is not null
            ? await _db.UserRewards.AsNoTracking()
                .Where(ur => ur.UserId == userId && ur.IsActive)
                .Select(ur => ur.RewardItemId)
                .ToListAsync(ct)
            : new List<int>();

        var items = await query
            .OrderBy(r => r.Category)
            .ThenBy(r => r.CreditCost)
            .Select(r => new RewardItemDto(
                r.Id, r.Name, r.Description, r.Category, r.CreditCost,
                r.Value, r.PreviewUrl,
                unlockedIds.Contains(r.Id),
                activeIds.Contains(r.Id)))
            .ToListAsync(ct);

        return Result<List<RewardItemDto>>.Success(items);
    }
}
