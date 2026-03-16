namespace UpToU.Core.Interfaces;

/// <summary>
/// Checks whether a user has earned new category badges and inserts award records.
/// Does NOT call SaveChangesAsync — the caller is responsible for saving.
/// </summary>
public interface IBadgeAwardService
{
    Task AwardEligibleBadgesAsync(
        string userId,
        int categoryId,
        int categoryScore,
        CancellationToken ct);
}
