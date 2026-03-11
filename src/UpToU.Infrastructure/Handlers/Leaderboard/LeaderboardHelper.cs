using Microsoft.EntityFrameworkCore;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Leaderboard;

internal record UserProfile(
    string DisplayName,
    string? MentionHandle,
    string? ActiveTitle,
    string? ActiveAvatarFrameUrl,
    string? AvatarUrl,
    int AllTimeCredits
);

internal static class LeaderboardHelper
{
    internal static DateTime? GetCutoff(string timePeriod) => timePeriod switch
    {
        "Weekly" => DateTime.UtcNow.AddDays(-7),
        "Monthly" => DateTime.UtcNow.AddDays(-30),
        _ => null, // AllTime
    };

    internal static async Task<Dictionary<string, UserProfile>> GetUserProfiles(
        ApplicationDbContext db, List<string> userIds, CancellationToken ct)
    {
        if (userIds.Count == 0)
            return new Dictionary<string, UserProfile>();

        var users = await db.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, ct);

        var allTimeCredits = await db.CreditTransactions
            .AsNoTracking()
            .Where(t => userIds.Contains(t.UserId) && t.Amount > 0)
            .GroupBy(t => t.UserId)
            .Select(g => new { UserId = g.Key, Total = g.Sum(t => t.Amount) })
            .ToDictionaryAsync(x => x.UserId, x => (int)x.Total, ct);

        return users.ToDictionary(
            kvp => kvp.Key,
            kvp =>
            {
                var u = kvp.Value;
                return new UserProfile(
                    $"{u.FirstName} {u.LastName}".Trim(),
                    u.MentionHandle,
                    u.ActiveTitle,
                    u.ActiveAvatarFrameUrl,
                    u.AvatarUrl,
                    AllTimeCredits: allTimeCredits.GetValueOrDefault(u.Id, 0)
                );
            });
    }
}
