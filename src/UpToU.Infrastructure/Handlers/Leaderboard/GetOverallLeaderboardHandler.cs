using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Leaderboard;
using UpToU.Core.DTOs.Leaderboard;
using UpToU.Core.Models;
using UpToU.Core.Services;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Leaderboard;

public class GetOverallLeaderboardHandler
    : IRequestHandler<GetOverallLeaderboardQuery, Result<LeaderboardDto>>
{
    private readonly ApplicationDbContext _db;

    public GetOverallLeaderboardHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<LeaderboardDto>> Handle(
        GetOverallLeaderboardQuery request, CancellationToken ct)
    {
        var cutoff = LeaderboardHelper.GetCutoff(request.TimePeriod);

        var query = _db.CreditTransactions.AsNoTracking()
            .Where(t => t.Amount > 0);

        if (cutoff.HasValue)
            query = query.Where(t => t.CreatedAt >= cutoff.Value);

        var grouped = await query
            .GroupBy(t => t.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                TotalCredits = g.Sum(t => t.Amount),
                ActivityCount = g.Count(),
            })
            .OrderByDescending(x => x.TotalCredits)
            .Take(request.Top)
            .ToListAsync(ct);

        var userIds = grouped.Select(g => g.UserId).ToList();
        var users = await LeaderboardHelper.GetUserProfiles(_db, userIds, ct);

        var entries = grouped.Select((g, i) =>
        {
            var u = users.GetValueOrDefault(g.UserId);
            var rank = RankHelper.GetRank(u?.AllTimeCredits ?? 0);
            return new LeaderboardEntryDto(
                Rank: i + 1,
                UserId: g.UserId,
                DisplayName: u?.DisplayName ?? "Unknown",
                MentionHandle: u?.MentionHandle,
                ActiveTitle: u?.ActiveTitle,
                ActiveAvatarFrameUrl: u?.ActiveAvatarFrameUrl,
                AvatarUrl: u?.AvatarUrl,
                TotalCredits: g.TotalCredits,
                ActivityCount: g.ActivityCount,
                RankName: rank.Name,
                RankStars: rank.Stars
            );
        }).ToList();

        return Result<LeaderboardDto>.Success(new LeaderboardDto(
            BoardType: "Overall",
            CategoryId: null,
            CategoryTitle: null,
            TimePeriod: request.TimePeriod,
            Entries: entries
        ));
    }
}
