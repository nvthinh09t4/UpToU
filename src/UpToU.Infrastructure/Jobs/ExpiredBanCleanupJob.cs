using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Jobs;

public class ExpiredBanCleanupJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ExpiredBanCleanupJob> _logger;

    public ExpiredBanCleanupJob(ApplicationDbContext db, ILogger<ExpiredBanCleanupJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var expiredBans = await _db.UserBans
            .Where(b => b.RevokedAt == null && b.ExpiresAt != null && b.ExpiresAt <= now)
            .ToListAsync(ct);

        if (expiredBans.Count == 0)
        {
            _logger.LogDebug("ExpiredBanCleanupJob: no expired bans found.");
            return;
        }

        foreach (var ban in expiredBans)
        {
            ban.RevokedAt = now;
            ban.RevokedBy = "system";

            _db.Notifications.Add(new Core.Entities.Notification
            {
                RecipientId = ban.UserId,
                Type = "System",
                ActorName = "System",
                Message = ban.BanType == "Category"
                    ? "Your category restriction has expired. You can now post in that category again."
                    : "Your temporary ban has expired. You have been reinstated.",
            });
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "ExpiredBanCleanupJob completed. {RevokedCount} bans auto-revoked.",
            expiredBans.Count);
    }
}
