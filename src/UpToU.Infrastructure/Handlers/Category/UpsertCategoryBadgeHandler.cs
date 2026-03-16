using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.DTOs.Category;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Category;

public class UpsertCategoryBadgeHandler : IRequestHandler<UpsertCategoryBadgeCommand, Result<CategoryBadgeDto>>
{
    private readonly ApplicationDbContext _db;
    public UpsertCategoryBadgeHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<CategoryBadgeDto>> Handle(UpsertCategoryBadgeCommand request, CancellationToken ct)
    {
        if (request.Tier < 1 || request.Tier > 5)
            return Result<CategoryBadgeDto>.Failure("Tier must be between 1 and 5.");

        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct);
        if (!categoryExists)
            return Result<CategoryBadgeDto>.NotFound("Category not found.");

        // Enforce one badge per tier per category
        var duplicate = await _db.CategoryBadges.AnyAsync(
            b => b.CategoryId == request.CategoryId
              && b.Tier == request.Tier
              && b.Id != (request.Id ?? 0), ct);
        if (duplicate)
            return Result<CategoryBadgeDto>.Failure($"A badge for Tier {request.Tier} already exists in this category.");

        CategoryBadge badge;
        if (request.Id.HasValue)
        {
            badge = await _db.CategoryBadges.FirstOrDefaultAsync(b => b.Id == request.Id.Value, ct)
                ?? throw new KeyNotFoundException($"Badge {request.Id} not found.");
        }
        else
        {
            badge = new CategoryBadge { CategoryId = request.CategoryId };
            _db.CategoryBadges.Add(badge);
        }

        badge.Tier            = request.Tier;
        badge.Label           = request.Label;
        badge.LabelVi         = request.LabelVi;
        badge.ScoreThreshold  = request.ScoreThreshold;
        badge.BadgeImageUrl   = request.BadgeImageUrl;

        await _db.SaveChangesAsync(ct);

        return Result<CategoryBadgeDto>.Success(
            new CategoryBadgeDto(badge.Id, badge.Tier, badge.Label, badge.LabelVi, badge.ScoreThreshold, badge.BadgeImageUrl));
    }
}
