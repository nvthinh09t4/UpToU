using Dapper;
using MediatR;
using UpToU.Core.Commands.Progress;
using UpToU.Core.DTOs.Progress;
using UpToU.Core.Interfaces;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Progress;

public class GetUserProgressHandler : IRequestHandler<GetUserProgressQuery, Result<UserProgressDto>>
{
    private readonly IDbConnectionFactory _db;

    public GetUserProgressHandler(IDbConnectionFactory db) => _db = db;

    public async Task<Result<UserProgressDto>> Handle(GetUserProgressQuery request, CancellationToken ct)
    {
        var userId = request.UserId;

        var categoryTask   = GetCategoryCreditsAsync(userId, ct);
        var dailyTask      = GetDailyCreditsAsync(userId, ct);
        var inProgressTask = GetInProgressStoriesAsync(userId, ct);
        var suggestedTask  = GetSuggestedStoriesAsync(userId, ct);
        var trendingTask   = GetTrendingStoriesAsync(userId, ct);
        var countsTask     = GetStoryCounts(userId, ct);

        await Task.WhenAll(categoryTask, dailyTask, inProgressTask, suggestedTask, trendingTask, countsTask);

        var (started, completed) = await countsTask;
        return Result<UserProgressDto>.Success(new UserProgressDto(
            await categoryTask,
            await dailyTask,
            await inProgressTask,
            await suggestedTask,
            await trendingTask,
            started,
            completed
        ));
    }

    private async Task<List<CategoryCreditDto>> GetCategoryCreditsAsync(string userId, CancellationToken ct)
    {
        const string sql = """
            SELECT ct.CategoryId, c.Title AS CategoryTitle, SUM(ct.Amount) AS CreditsEarned
            FROM CreditTransactions ct
            JOIN Categories c ON c.Id = ct.CategoryId AND c.IsDeleted = 0
            WHERE ct.UserId = @userId AND ct.Amount > 0 AND ct.CategoryId IS NOT NULL
            GROUP BY ct.CategoryId, c.Title
            ORDER BY CreditsEarned DESC
            """;
        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var rows = await conn!.QueryAsync<CategoryCreditDto>(sql, new { userId });
        return rows.ToList();
    }

    private async Task<List<DailyCreditDto>> GetDailyCreditsAsync(string userId, CancellationToken ct)
    {
        const string sql = """
            SELECT CAST(CreatedAt AS DATE) AS Date, SUM(Amount) AS CreditsEarned
            FROM CreditTransactions
            WHERE UserId = @userId AND Amount > 0 AND CreatedAt >= DATEADD(day,-30,GETUTCDATE())
            GROUP BY CAST(CreatedAt AS DATE)
            ORDER BY Date
            """;
        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var rows = await conn!.QueryAsync<DailyCreditDto>(sql, new { userId });
        return rows.ToList();
    }

    private async Task<List<InProgressStoryDto>> GetInProgressStoriesAsync(string userId, CancellationToken ct)
    {
        const string sql = """
            SELECT
                usp.StoryId,
                s.Title,
                ISNULL(c.Title,'') AS CategoryTitle,
                s.CoverImageUrl,
                (SELECT COUNT(*) FROM UserStoryAnswers usa WHERE usa.ProgressId = usp.Id) AS VisitedNodes,
                (SELECT COUNT(*) FROM StoryNodes sn WHERE sn.StoryDetailId = usp.StoryDetailId) AS TotalNodes,
                usp.TotalPointsEarned AS PointsEarned,
                usp.StartedAt,
                usp.UpdatedAt
            FROM UserStoryProgresses usp
            JOIN Stories s ON s.Id = usp.StoryId AND s.IsDeleted = 0
            LEFT JOIN Categories c ON c.Id = s.CategoryId AND c.IsDeleted = 0
            WHERE usp.UserId = @userId AND usp.IsCompleted = 0
            ORDER BY usp.UpdatedAt DESC
            """;
        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var rows = await conn!.QueryAsync<InProgressStoryDto>(sql, new { userId });
        return rows.ToList();
    }

    private async Task<List<SuggestedStoryDto>> GetSuggestedStoriesAsync(string userId, CancellationToken ct)
    {
        const string sql = """
            SELECT TOP 6
                s.Id, s.Title,
                ISNULL(c.Title,'') AS CategoryTitle,
                s.CoverImageUrl, s.ViewCount
            FROM Stories s
            LEFT JOIN Categories c ON c.Id = s.CategoryId AND c.IsDeleted = 0
            WHERE s.IsDeleted = 0
                AND s.Id NOT IN (SELECT StoryId FROM UserStoryProgresses WHERE UserId = @userId)
            ORDER BY s.ViewCount DESC
            """;
        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var rows = await conn!.QueryAsync<SuggestedStoryDto>(sql, new { userId });
        return rows.ToList();
    }

    private async Task<List<SuggestedStoryDto>> GetTrendingStoriesAsync(string userId, CancellationToken ct)
    {
        const string sql = """
            SELECT TOP 6
                s.Id, s.Title,
                ISNULL(c.Title,'') AS CategoryTitle,
                s.CoverImageUrl,
                s.ViewCount
            FROM Stories s
            LEFT JOIN Categories c ON c.Id = s.CategoryId AND c.IsDeleted = 0
            WHERE s.IsDeleted = 0
            ORDER BY (
                (SELECT COUNT(*) FROM Comments   cm WHERE cm.StoryId = s.Id AND cm.CreatedAt  >= DATEADD(day,-7,GETUTCDATE())) * 5 +
                (SELECT COUNT(*) FROM Reactions  r  WHERE r.StoryId  = s.Id AND r.CreatedAt   >= DATEADD(day,-7,GETUTCDATE())) * 3 +
                (SELECT COUNT(*) FROM StoryVotes sv WHERE sv.StoryId = s.Id AND sv.CreatedAt  >= DATEADD(day,-7,GETUTCDATE())) * 2 +
                (SELECT COUNT(*) FROM Bookmarks  b  WHERE b.StoryId  = s.Id AND b.CreatedAt   >= DATEADD(day,-7,GETUTCDATE())) * 4
            ) DESC, s.ViewCount DESC
            """;
        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var rows = await conn!.QueryAsync<SuggestedStoryDto>(sql, new { userId });
        return rows.ToList();
    }

    private async Task<(int Started, int Completed)> GetStoryCounts(string userId, CancellationToken ct)
    {
        const string sql = """
            SELECT
                COUNT(*) AS Started,
                SUM(CASE WHEN IsCompleted = 1 THEN 1 ELSE 0 END) AS Completed
            FROM UserStoryProgresses
            WHERE UserId = @userId
            """;
        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var r = await conn!.QuerySingleAsync<dynamic>(sql, new { userId });
        return ((int)r.Started, (int)r.Completed);
    }
}
