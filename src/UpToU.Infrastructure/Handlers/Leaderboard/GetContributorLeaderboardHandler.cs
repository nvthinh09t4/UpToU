using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Leaderboard;
using UpToU.Core.DTOs.Leaderboard;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Leaderboard;

public class GetContributorLeaderboardHandler
    : IRequestHandler<GetContributorLeaderboardQuery, Result<ContributorLeaderboardDto>>
{
    private readonly ApplicationDbContext _db;

    public GetContributorLeaderboardHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<ContributorLeaderboardDto>> Handle(
        GetContributorLeaderboardQuery request, CancellationToken ct)
    {
        // Aggregate contributed-point transactions per author
        var grouped = await _db.ContributedPointTransactions
            .AsNoTracking()
            .GroupBy(t => t.AuthorId)
            .Select(g => new
            {
                AuthorId         = g.Key,
                ContributedPoints = g.Sum(t => t.Points),
                UniqueReaders    = g.Select(t => t.ReaderId).Distinct().Count(),
            })
            .OrderByDescending(x => x.ContributedPoints)
            .ThenByDescending(x => x.UniqueReaders)
            .Take(request.Top)
            .ToListAsync(ct);

        if (grouped.Count == 0)
            return Result<ContributorLeaderboardDto>.Success(
                new ContributorLeaderboardDto("Contributor", []));

        var authorIds = grouped.Select(g => g.AuthorId).ToList();
        var users = await LeaderboardHelper.GetUserProfiles(_db, authorIds, ct);

        // The #1 author is the current Contributor Champion
        var championId = grouped[0].AuthorId;

        var entries = grouped.Select((g, i) =>
        {
            var u = users.GetValueOrDefault(g.AuthorId);
            return new ContributorLeaderboardEntryDto(
                Rank:             i + 1,
                UserId:           g.AuthorId,
                DisplayName:      u?.DisplayName ?? "Unknown",
                MentionHandle:    u?.MentionHandle,
                ActiveTitle:      u?.ActiveTitle,
                ActiveAvatarFrameUrl: u?.ActiveAvatarFrameUrl,
                AvatarUrl:        u?.AvatarUrl,
                ContributedPoints: g.ContributedPoints,
                UniqueReaders:    g.UniqueReaders,
                IsChampion:       g.AuthorId == championId
            );
        }).ToList();

        return Result<ContributorLeaderboardDto>.Success(
            new ContributorLeaderboardDto("Contributor", entries));
    }
}
