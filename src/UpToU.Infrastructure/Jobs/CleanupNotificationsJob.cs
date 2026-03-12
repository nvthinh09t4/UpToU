using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Jobs;

public class CleanupNotificationsJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<CleanupNotificationsJob> _logger;

    public CleanupNotificationsJob(ApplicationDbContext db, ILogger<CleanupNotificationsJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(-5);

        var deleted = await _db.Notifications
            .Where(n => n.IsArchived && !n.IsImportant && n.ArchivedAt <= cutoff)
            .ExecuteDeleteAsync(ct);

        _logger.LogInformation(
            "CleanupNotificationsJob completed. {DeletedCount} notifications removed.",
            deleted);
    }
}
