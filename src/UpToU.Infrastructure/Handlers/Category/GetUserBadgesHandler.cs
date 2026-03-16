using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.DTOs.Category;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Category;

public class GetUserBadgesHandler : IRequestHandler<GetUserBadgesQuery, Result<List<UserCategoryBadgeDto>>>
{
    private readonly ApplicationDbContext _db;
    public GetUserBadgesHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<UserCategoryBadgeDto>>> Handle(GetUserBadgesQuery request, CancellationToken ct)
    {
        var badges = await _db.UserCategoryBadges.AsNoTracking()
            .Where(ub => ub.UserId == request.UserId)
            .OrderByDescending(ub => ub.AwardedAt)
            .Select(ub => new UserCategoryBadgeDto(
                ub.BadgeId,
                ub.Badge.CategoryId,
                ub.Badge.Category.Title,
                ub.Badge.Tier,
                ub.Badge.Label,
                ub.Badge.LabelVi,
                ub.Badge.BadgeImageUrl,
                ub.AwardedAt))
            .ToListAsync(ct);

        return Result<List<UserCategoryBadgeDto>>.Success(badges);
    }
}
