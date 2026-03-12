using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Jobs;

public class ClearExpiredDisplayNamesJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ClearExpiredDisplayNamesJob> _logger;

    public ClearExpiredDisplayNamesJob(ApplicationDbContext db, ILogger<ClearExpiredDisplayNamesJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("ClearExpiredDisplayNames job started.");

        var cleared = await _db.Users
            .Where(u => u.DisplayName != null
                     && u.DisplayNameExpiresAt != null
                     && u.DisplayNameExpiresAt <= DateTime.UtcNow)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.DisplayName, (string?)null)
                .SetProperty(u => u.DisplayNameExpiresAt, (DateTime?)null),
            ct);

        _logger.LogInformation("ClearExpiredDisplayNames job completed. {ClearedCount} expired display names reverted.", cleared);
    }
}
