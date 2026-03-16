using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Core.Entities;
using UpToU.Core.Interfaces;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Services;

public class BadgeAwardService : IBadgeAwardService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<BadgeAwardService> _logger;

    public BadgeAwardService(ApplicationDbContext db, ILogger<BadgeAwardService> logger)
    {
        _db     = db;
        _logger = logger;
    }

    public async Task AwardEligibleBadgesAsync(
        string userId, int categoryId, int categoryScore, CancellationToken ct)
    {
        var badges = await _db.CategoryBadges.AsNoTracking()
            .Where(b => b.CategoryId == categoryId && b.ScoreThreshold <= categoryScore)
            .ToListAsync(ct);

        if (badges.Count == 0) return;

        var alreadyHeld = await _db.UserCategoryBadges.AsNoTracking()
            .Where(ub => ub.UserId == userId && badges.Select(b => b.Id).Contains(ub.BadgeId))
            .Select(ub => ub.BadgeId)
            .ToListAsync(ct);

        var now = DateTime.UtcNow;
        foreach (var badge in badges)
        {
            if (alreadyHeld.Contains(badge.Id)) continue;

            _db.UserCategoryBadges.Add(new UserCategoryBadge
            {
                UserId    = userId,
                BadgeId   = badge.Id,
                AwardedAt = now,
            });

            _logger.LogInformation(
                "Badge awarded. {UserId} {BadgeId} {CategoryId} {CategoryScore}",
                userId, badge.Id, categoryId, categoryScore);
        }
    }
}
