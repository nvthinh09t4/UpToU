using Dapper;
using MediatR;
using UpToU.Core.Commands.Admin;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Interfaces;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Admin;

public class GetReportsHandler : IRequestHandler<GetReportsQuery, Result<ReportDto>>
{
    private readonly IDbConnectionFactory _db;

    public GetReportsHandler(IDbConnectionFactory db) => _db = db;

    public async Task<Result<ReportDto>> Handle(GetReportsQuery request, CancellationToken ct)
    {
        // Each helper opens its own connection from the pool → true parallelism via Task.WhenAll
        var overviewTask         = GetOverviewAsync(ct);
        var topStoriesTask       = GetTopStoriesAsync(ct);
        var trendingStoriesTask  = GetTrendingStoriesAsync(ct);
        var mostActiveUsersTask  = GetMostActiveUsersAsync(ct);
        var categoryStatsTask    = GetCategoryStatsAsync(ct);
        var reactionDistTask     = GetReactionDistributionAsync(ct);

        await Task.WhenAll(overviewTask, topStoriesTask, trendingStoriesTask,
                           mostActiveUsersTask, categoryStatsTask, reactionDistTask);

        return Result<ReportDto>.Success(new ReportDto(
            await overviewTask,
            await topStoriesTask,
            await trendingStoriesTask,
            await mostActiveUsersTask,
            await categoryStatsTask,
            await reactionDistTask
        ));
    }

    // ── Overview ──────────────────────────────────────────────────────────────

    private async Task<SiteOverviewDto> GetOverviewAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT
                (SELECT COUNT(*)  FROM AspNetUsers)                                                    AS TotalUsers,
                (SELECT COUNT(*)  FROM AspNetUsers WHERE CreatedAt >= DATEADD(day,-7,GETUTCDATE()))    AS NewUsersThisWeek,
                (SELECT COUNT(*)  FROM AspNetUsers WHERE CreatedAt >= DATEADD(day,-30,GETUTCDATE()))   AS NewUsersThisMonth,
                (SELECT COUNT(*)  FROM Stories WHERE IsDeleted = 0)                                    AS PublishedStories,
                (SELECT COUNT(*)  FROM Stories)                                                        AS TotalStories,
                (SELECT ISNULL(SUM(CAST(ViewCount AS bigint)),0) FROM Stories WHERE IsDeleted = 0)     AS TotalViews,
                (SELECT COUNT(*)  FROM Comments  WHERE IsDeleted = 0)                                  AS TotalComments,
                (SELECT COUNT(*)  FROM Reactions)                                                      AS TotalReactions,
                (SELECT COUNT(*)  FROM StoryVotes)                                                     AS TotalVotes,
                (SELECT COUNT(*)  FROM Bookmarks)                                                      AS TotalBookmarks
            """;

        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var row = await conn!.QuerySingleAsync<dynamic>(sql);

        return new SiteOverviewDto(
            TotalUsers:        (int)row.TotalUsers,
            NewUsersThisWeek:  (int)row.NewUsersThisWeek,
            NewUsersThisMonth: (int)row.NewUsersThisMonth,
            TotalStories:      (int)row.TotalStories,
            PublishedStories:  (int)row.PublishedStories,
            TotalViews:        (long)row.TotalViews,
            TotalComments:     (int)row.TotalComments,
            TotalReactions:    (int)row.TotalReactions,
            TotalVotes:        (int)row.TotalVotes,
            TotalBookmarks:    (int)row.TotalBookmarks
        );
    }

    // ── Top Stories ───────────────────────────────────────────────────────────

    private async Task<List<StoryStatsDto>> GetTopStoriesAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT TOP 10
                s.Id, s.Title,
                ISNULL(c.Title, '')       AS CategoryTitle,
                s.CoverImageUrl,
                s.AuthorName,
                s.ViewCount,
                COUNT(DISTINCT cm.Id)     AS CommentCount,
                COUNT(DISTINCT r.Id)      AS ReactionCount,
                SUM(CASE WHEN sv.VoteType='Up'   THEN 1 ELSE 0 END) AS UpvoteCount,
                SUM(CASE WHEN sv.VoteType='Down' THEN 1 ELSE 0 END) AS DownvoteCount,
                COUNT(DISTINCT b.Id)      AS BookmarkCount,
                s.PublishDate
            FROM Stories s
            LEFT JOIN Categories c  ON c.Id = s.CategoryId AND c.IsDeleted = 0
            LEFT JOIN Comments   cm ON cm.StoryId = s.Id   AND cm.IsDeleted = 0
            LEFT JOIN Reactions  r  ON r.StoryId  = s.Id
            LEFT JOIN StoryVotes sv ON sv.StoryId  = s.Id
            LEFT JOIN Bookmarks  b  ON b.StoryId   = s.Id
            WHERE s.IsDeleted = 0
            GROUP BY s.Id, s.Title, c.Title, s.CoverImageUrl, s.AuthorName, s.ViewCount, s.PublishDate
            ORDER BY s.ViewCount DESC
            """;

        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var rows = await conn!.QueryAsync<StoryStatsDto>(sql);
        return rows.ToList();
    }

    // ── Trending Stories (last 7 days) ────────────────────────────────────────

    private async Task<List<TrendingStoryDto>> GetTrendingStoriesAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT TOP 10
                s.Id, s.Title,
                ISNULL(c.Title, '')  AS CategoryTitle,
                s.CoverImageUrl,
                COUNT(DISTINCT cm.Id) * 5
                  + COUNT(DISTINCT r.Id)  * 3
                  + COUNT(DISTINCT sv.Id) * 2
                  + COUNT(DISTINCT b.Id)  * 4  AS TrendScore,
                COUNT(DISTINCT cm.Id) AS RecentComments,
                COUNT(DISTINCT r.Id)  AS RecentReactions,
                COUNT(DISTINCT sv.Id) AS RecentVotes,
                COUNT(DISTINCT b.Id)  AS RecentBookmarks
            FROM Stories s
            LEFT JOIN Categories c  ON c.Id = s.CategoryId AND c.IsDeleted = 0
            LEFT JOIN Comments   cm ON cm.StoryId = s.Id AND cm.IsDeleted = 0
                                    AND cm.CreatedAt >= DATEADD(day,-7,GETUTCDATE())
            LEFT JOIN Reactions  r  ON r.StoryId  = s.Id
                                    AND r.CreatedAt  >= DATEADD(day,-7,GETUTCDATE())
            LEFT JOIN StoryVotes sv ON sv.StoryId  = s.Id
                                    AND sv.CreatedAt >= DATEADD(day,-7,GETUTCDATE())
            LEFT JOIN Bookmarks  b  ON b.StoryId   = s.Id
                                    AND b.CreatedAt  >= DATEADD(day,-7,GETUTCDATE())
            WHERE s.IsDeleted = 0
            GROUP BY s.Id, s.Title, c.Title, s.CoverImageUrl
            HAVING COUNT(DISTINCT cm.Id) + COUNT(DISTINCT r.Id)
                 + COUNT(DISTINCT sv.Id) + COUNT(DISTINCT b.Id) > 0
            ORDER BY TrendScore DESC
            """;

        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var rows = await conn!.QueryAsync<TrendingStoryDto>(sql);
        return rows.ToList();
    }

    // ── Most Active Users ─────────────────────────────────────────────────────

    private async Task<List<UserActivityDto>> GetMostActiveUsersAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT TOP 10
                u.Id,
                u.FirstName + ' ' + u.LastName   AS Name,
                ISNULL(u.Email, '')               AS Email,
                u.MentionHandle,
                u.CreatedAt,
                COUNT(DISTINCT cm.Id)  AS CommentCount,
                COUNT(DISTINCT r.Id)   AS ReactionCount,
                COUNT(DISTINCT sv.Id)  AS VoteCount,
                COUNT(DISTINCT b.Id)   AS BookmarkCount,
                COUNT(DISTINCT cm.Id) + COUNT(DISTINCT r.Id)
                  + COUNT(DISTINCT sv.Id) + COUNT(DISTINCT b.Id) AS TotalActivity
            FROM AspNetUsers u
            LEFT JOIN Comments   cm ON cm.AuthorId = u.Id AND cm.IsDeleted = 0
            LEFT JOIN Reactions  r  ON r.UserId    = u.Id
            LEFT JOIN StoryVotes sv ON sv.UserId   = u.Id
            LEFT JOIN Bookmarks  b  ON b.UserId    = u.Id
            GROUP BY u.Id, u.FirstName, u.LastName, u.Email, u.MentionHandle, u.CreatedAt
            HAVING COUNT(DISTINCT cm.Id) + COUNT(DISTINCT r.Id)
                 + COUNT(DISTINCT sv.Id) + COUNT(DISTINCT b.Id) > 0
            ORDER BY TotalActivity DESC
            """;

        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var rows = await conn!.QueryAsync<UserActivityDto>(sql);
        return rows.ToList();
    }

    // ── Category Stats ────────────────────────────────────────────────────────

    private async Task<List<CategoryStatsDto>> GetCategoryStatsAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT
                c.Id,
                c.Title,
                COUNT(DISTINCT s.Id)                                  AS StoryCount,
                ISNULL(SUM(CAST(s.ViewCount AS bigint)), 0)           AS TotalViews,
                COUNT(DISTINCT cm.Id)                                 AS TotalComments,
                COUNT(DISTINCT r.Id)                                  AS TotalReactions,
                COUNT(DISTINCT b.Id)                                  AS TotalBookmarks
            FROM Categories c
            LEFT JOIN Stories    s  ON s.CategoryId = c.Id AND s.IsDeleted = 0
            LEFT JOIN Comments   cm ON cm.StoryId   = s.Id AND cm.IsDeleted = 0
            LEFT JOIN Reactions  r  ON r.StoryId    = s.Id
            LEFT JOIN Bookmarks  b  ON b.StoryId    = s.Id
            WHERE c.IsDeleted = 0
            GROUP BY c.Id, c.Title
            ORDER BY TotalViews DESC
            """;

        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var rows = await conn!.QueryAsync<CategoryStatsDto>(sql);
        return rows.ToList();
    }

    // ── Reaction Distribution ─────────────────────────────────────────────────

    private async Task<ReactionDistributionDto> GetReactionDistributionAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT
                SUM(CASE WHEN ReactionType = 'Like'  THEN 1 ELSE 0 END) AS LikeCount,
                SUM(CASE WHEN ReactionType = 'Love'  THEN 1 ELSE 0 END) AS LoveCount,
                SUM(CASE WHEN ReactionType = 'Laugh' THEN 1 ELSE 0 END) AS LaughCount
            FROM Reactions
            """;

        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var row = await conn!.QuerySingleAsync<ReactionDistributionDto>(sql);
        return row;
    }
}
