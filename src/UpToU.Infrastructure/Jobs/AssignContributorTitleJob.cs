using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Jobs;

/// <summary>
/// Daily job that grants the exclusive "Contributor Champion" title to the author
/// with the highest contributed points, and revokes it from the previous holder.
/// </summary>
public class AssignContributorTitleJob
{
    /// <summary>
    /// The <c>Value</c> stored on the RewardItem for the exclusive title.
    /// This is what gets written into <c>ApplicationUser.ActiveTitle</c>.
    /// </summary>
    public const string ChampionTitleValue = "✍️ Contributor Champion";

    private readonly ApplicationDbContext _db;
    private readonly ILogger<AssignContributorTitleJob> _logger;

    public AssignContributorTitleJob(ApplicationDbContext db, ILogger<AssignContributorTitleJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("AssignContributorTitleJob started.");

        // Find the author with the highest contributed points
        var topAuthor = await _db.Users
            .AsNoTracking()
            .Where(u => u.ContributedPoints > 0)
            .OrderByDescending(u => u.ContributedPoints)
            .Select(u => new { u.Id, u.ContributedPoints })
            .FirstOrDefaultAsync(ct);

        if (topAuthor is null)
        {
            _logger.LogInformation("AssignContributorTitleJob: no authors with contributed points yet.");
            return;
        }

        // Find the exclusive champion reward item to get its Id
        var championReward = await _db.RewardItems
            .AsNoTracking()
            .Where(r => r.IsExclusive && r.Value == ChampionTitleValue)
            .Select(r => new { r.Id })
            .FirstOrDefaultAsync(ct);

        if (championReward is null)
        {
            _logger.LogWarning("AssignContributorTitleJob: Contributor Champion reward item not found in database.");
            return;
        }

        // Find the current holder (if any)
        var currentHolder = await _db.UserRewards
            .Where(ur => ur.RewardItemId == championReward.Id && ur.IsActive)
            .Select(ur => new { ur.UserId, ur.Id })
            .FirstOrDefaultAsync(ct);

        // Already assigned to the correct person — nothing to do
        if (currentHolder?.UserId == topAuthor.Id)
        {
            _logger.LogInformation(
                "AssignContributorTitleJob: {UserId} is already the champion ({Points} pts). No change.",
                topAuthor.Id, topAuthor.ContributedPoints);
            return;
        }

        // Revoke title from previous holder
        if (currentHolder is not null)
        {
            await _db.UserRewards
                .Where(ur => ur.Id == currentHolder.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(ur => ur.IsActive, false), ct);

            // Clear ActiveTitle on their profile if it matches the champion title
            await _db.Users
                .Where(u => u.Id == currentHolder.UserId && u.ActiveTitle == ChampionTitleValue)
                .ExecuteUpdateAsync(s => s.SetProperty(u => u.ActiveTitle, (string?)null), ct);

            _logger.LogInformation(
                "AssignContributorTitleJob: title revoked from {OldUserId}.", currentHolder.UserId);
        }

        // Grant to the new champion
        var existing = await _db.UserRewards
            .Where(ur => ur.UserId == topAuthor.Id && ur.RewardItemId == championReward.Id)
            .FirstOrDefaultAsync(ct);

        if (existing is not null)
        {
            existing.IsActive    = true;
            existing.UnlockedAt  = DateTime.UtcNow;
        }
        else
        {
            _db.UserRewards.Add(new Core.Entities.UserReward
            {
                UserId       = topAuthor.Id,
                RewardItemId = championReward.Id,
                IsActive     = true,
                UnlockedAt   = DateTime.UtcNow,
            });
        }

        // Set ActiveTitle on their profile
        await _db.Users
            .Where(u => u.Id == topAuthor.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.ActiveTitle, ChampionTitleValue), ct);

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "AssignContributorTitleJob: {UserId} is now Contributor Champion ({Points} pts).",
            topAuthor.Id, topAuthor.ContributedPoints);
    }
}
