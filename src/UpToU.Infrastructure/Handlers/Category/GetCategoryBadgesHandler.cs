using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.DTOs.Category;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Category;

public class GetCategoryBadgesHandler : IRequestHandler<GetCategoryBadgesQuery, Result<List<CategoryBadgeDto>>>
{
    private readonly ApplicationDbContext _db;
    public GetCategoryBadgesHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<CategoryBadgeDto>>> Handle(GetCategoryBadgesQuery request, CancellationToken ct)
    {
        var badges = await _db.CategoryBadges.AsNoTracking()
            .Where(b => b.CategoryId == request.CategoryId)
            .OrderBy(b => b.Tier)
            .Select(b => new CategoryBadgeDto(b.Id, b.Tier, b.Label, b.LabelVi, b.ScoreThreshold, b.BadgeImageUrl))
            .ToListAsync(ct);

        return Result<List<CategoryBadgeDto>>.Success(badges);
    }
}
