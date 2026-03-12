using Dapper;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Admin;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Entities;
using UpToU.Core.Interfaces;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Admin;

public class GetDashboardStatsHandler : IRequestHandler<GetDashboardStatsQuery, Result<DashboardStatsDto>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IDbConnectionFactory _db;

    public GetDashboardStatsHandler(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IDbConnectionFactory db)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
    }

    public async Task<Result<DashboardStatsDto>> Handle(GetDashboardStatsQuery request, CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;

        // Identity queries are sequential (single DbContext under the hood)
        var totalUsers       = await _userManager.Users.CountAsync(ct);
        var registeredToday  = await _userManager.Users.CountAsync(u => u.CreatedAt >= today, ct);
        var loggedInToday    = await _userManager.Users.CountAsync(u => u.LastLoginAt != null && u.LastLoginAt >= today, ct);
        var activeUsers      = await _userManager.Users.CountAsync(u => u.IsActive, ct);
        var totalRoles       = await _roleManager.Roles.CountAsync(ct);

        // Content stats + recent lists via Dapper — each opens its own connection → parallel
        var contentTask       = GetContentStatsAsync(ct);
        var recentUsersTask   = GetRecentUsersAsync(ct);
        var recentStoriesTask = GetRecentStoriesAsync(ct);

        await Task.WhenAll(contentTask, recentUsersTask, recentStoriesTask);

        var c = await contentTask;
        return Result<DashboardStatsDto>.Success(new DashboardStatsDto(
            TotalUsers:       totalUsers,
            RegisteredToday:  registeredToday,
            LoggedInToday:    loggedInToday,
            TotalRoles:       totalRoles,
            ActiveUsers:      activeUsers,
            TotalStories:     c.TotalStories,
            PublishedStories: c.PublishedStories,
            StoriesThisWeek:  c.StoriesThisWeek,
            TotalComments:    c.TotalComments,
            TotalReactions:   c.TotalReactions,
            RecentUsers:      await recentUsersTask,
            RecentStories:    await recentStoriesTask
        ));
    }

    // ── Dapper helpers ─────────────────────────────────────────────────────────

    private async Task<(int TotalStories, int PublishedStories, int StoriesThisWeek, long TotalComments, long TotalReactions)>
        GetContentStatsAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT
                (SELECT COUNT(*) FROM Stories)                                              AS TotalStories,
                (SELECT COUNT(*) FROM Stories WHERE IsDeleted = 0)                          AS PublishedStories,
                (SELECT COUNT(*) FROM Stories WHERE IsDeleted = 0
                    AND PublishDate >= DATEADD(day,-7,GETUTCDATE()))                        AS StoriesThisWeek,
                (SELECT COUNT(*) FROM Comments WHERE IsDeleted = 0)                         AS TotalComments,
                (SELECT COUNT(*) FROM Reactions)                                            AS TotalReactions
            """;

        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var r = await conn!.QuerySingleAsync<dynamic>(sql);
        return ((int)r.TotalStories, (int)r.PublishedStories, (int)r.StoriesThisWeek,
                (long)r.TotalComments, (long)r.TotalReactions);
    }

    private async Task<List<RecentUserDto>> GetRecentUsersAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT TOP 6 Id, FirstName, LastName, ISNULL(Email,'') AS Email, CreatedAt, IsActive
            FROM AspNetUsers
            ORDER BY CreatedAt DESC
            """;

        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var rows = await conn!.QueryAsync<RecentUserDto>(sql);
        return rows.ToList();
    }

    private async Task<List<RecentStoryDto>> GetRecentStoriesAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT TOP 6
                s.Id, s.Title,
                ISNULL(c.Title,'') AS CategoryTitle,
                s.ViewCount, s.PublishDate
            FROM Stories s
            LEFT JOIN Categories c ON c.Id = s.CategoryId AND c.IsDeleted = 0
            WHERE s.IsDeleted = 0
            ORDER BY ISNULL(s.PublishDate, s.CreatedOn) DESC
            """;

        await using var conn = (await _db.OpenAsync(ct)) as System.Data.Common.DbConnection;
        var rows = await conn!.QueryAsync<RecentStoryDto>(sql);
        return rows.ToList();
    }
}
