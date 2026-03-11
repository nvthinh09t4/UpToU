using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Admin;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Admin;

public class GetReportsHandler : IRequestHandler<GetReportsQuery, Result<ReportDto>>
{
    private readonly ApplicationDbContext _db;

    public GetReportsHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<ReportDto>> Handle(GetReportsQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var weekAgo = now.AddDays(-7);
        var monthAgo = now.AddDays(-30);
        var trendWindow = now.AddDays(-7);

        // ── Run all independent queries in parallel ─────────────────────────
        var totalUsersTask    = _db.Users.CountAsync(ct);
        var newWeekTask       = _db.Users.CountAsync(u => u.CreatedAt >= weekAgo, ct);
        var newMonthTask      = _db.Users.CountAsync(u => u.CreatedAt >= monthAgo, ct);
        var totalStoriesTask  = _db.Stories.IgnoreQueryFilters().CountAsync(ct);
        var publishedTask     = _db.Stories.CountAsync(ct); // global filter: IsPublish && !IsDeleted
        var totalViewsTask    = _db.Stories.SumAsync(s => (long)s.ViewCount, ct);
        var totalCommentsTask = _db.Comments.CountAsync(ct);
        var totalReactTask    = _db.Reactions.CountAsync(ct);
        var totalVotesTask    = _db.StoryVotes.CountAsync(ct) ;
        var totalBmTask       = _db.Bookmarks.CountAsync(ct);

        await Task.WhenAll(
            totalUsersTask, newWeekTask, newMonthTask,
            totalStoriesTask, publishedTask, totalViewsTask,
            totalCommentsTask, totalReactTask, totalVotesTask, totalBmTask);

        var overview = new SiteOverviewDto(
            TotalUsers: totalUsersTask.Result,
            NewUsersThisWeek: newWeekTask.Result,
            NewUsersThisMonth: newMonthTask.Result,
            TotalStories: totalStoriesTask.Result,
            PublishedStories: publishedTask.Result,
            TotalViews: totalViewsTask.Result,
            TotalComments: totalCommentsTask.Result,
            TotalReactions: totalReactTask.Result,
            TotalVotes: totalVotesTask.Result,
            TotalBookmarks: totalBmTask.Result
        );

        // ── Top 10 stories by view count ────────────────────────────────────
        var storyIds = await _db.Stories
            .AsNoTracking()
            .Include(s => s.Category)
            .OrderByDescending(s => s.ViewCount)
            .Take(10)
            .Select(s => s.Id)
            .ToListAsync(ct);

        var storiesRaw = await _db.Stories
            .AsNoTracking()
            .Include(s => s.Category)
            .Where(s => storyIds.Contains(s.Id))
            .ToListAsync(ct);

        var commentCounts = await _db.Comments
            .Where(c => storyIds.Contains(c.StoryId))
            .GroupBy(c => c.StoryId)
            .Select(g => new { StoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.StoryId, x => x.Count, ct);

        var reactionCounts = await _db.Reactions
            .Where(r => storyIds.Contains(r.StoryId))
            .GroupBy(r => r.StoryId)
            .Select(g => new { StoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.StoryId, x => x.Count, ct);

        var voteBreakdown = await _db.StoryVotes
            .Where(v => storyIds.Contains(v.StoryId))
            .GroupBy(v => new { v.StoryId, v.VoteType })
            .Select(g => new { g.Key.StoryId, g.Key.VoteType, Count = g.Count() })
            .ToListAsync(ct);

        var bookmarkCounts = await _db.Bookmarks
            .Where(b => storyIds.Contains(b.StoryId))
            .GroupBy(b => b.StoryId)
            .Select(g => new { StoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.StoryId, x => x.Count, ct);

        var topStories = storiesRaw
            .OrderByDescending(s => s.ViewCount)
            .Select(s => new StoryStatsDto(
                s.Id,
                s.Title,
                s.Category?.Title ?? string.Empty,
                s.CoverImageUrl,
                s.AuthorName,
                s.ViewCount,
                commentCounts.GetValueOrDefault(s.Id, 0),
                reactionCounts.GetValueOrDefault(s.Id, 0),
                voteBreakdown.FirstOrDefault(v => v.StoryId == s.Id && v.VoteType == "Up")?.Count ?? 0,
                voteBreakdown.FirstOrDefault(v => v.StoryId == s.Id && v.VoteType == "Down")?.Count ?? 0,
                bookmarkCounts.GetValueOrDefault(s.Id, 0),
                s.PublishDate
            )).ToList();

        // ── Trending: stories with most engagement in last 7 days ───────────
        var recentCommentStoryIds = await _db.Comments
            .Where(c => c.CreatedAt >= trendWindow)
            .GroupBy(c => c.StoryId)
            .Select(g => new { StoryId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var recentReactionStoryIds = await _db.Reactions
            .Where(r => r.CreatedAt >= trendWindow)
            .GroupBy(r => r.StoryId)
            .Select(g => new { StoryId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var recentVoteStoryIds = await _db.StoryVotes
            .Where(v => v.CreatedAt >= trendWindow)
            .GroupBy(v => v.StoryId)
            .Select(g => new { StoryId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var recentBookmarkStoryIds = await _db.Bookmarks
            .Where(b => b.CreatedAt >= trendWindow)
            .GroupBy(b => b.StoryId)
            .Select(g => new { StoryId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var allTrendIds = recentCommentStoryIds.Select(x => x.StoryId)
            .Union(recentReactionStoryIds.Select(x => x.StoryId))
            .Union(recentVoteStoryIds.Select(x => x.StoryId))
            .Union(recentBookmarkStoryIds.Select(x => x.StoryId))
            .Distinct()
            .ToList();

        var trendStories = await _db.Stories
            .AsNoTracking()
            .Include(s => s.Category)
            .Where(s => allTrendIds.Contains(s.Id))
            .ToListAsync(ct);

        var trendLookupC = recentCommentStoryIds.ToDictionary(x => x.StoryId, x => x.Count);
        var trendLookupR = recentReactionStoryIds.ToDictionary(x => x.StoryId, x => x.Count);
        var trendLookupV = recentVoteStoryIds.ToDictionary(x => x.StoryId, x => x.Count);
        var trendLookupB = recentBookmarkStoryIds.ToDictionary(x => x.StoryId, x => x.Count);

        var trendingStories = trendStories
            .Select(s =>
            {
                int c = trendLookupC.GetValueOrDefault(s.Id, 0);
                int r = trendLookupR.GetValueOrDefault(s.Id, 0);
                int v = trendLookupV.GetValueOrDefault(s.Id, 0);
                int b = trendLookupB.GetValueOrDefault(s.Id, 0);
                int score = c * 5 + r * 3 + v * 2 + b * 4;
                return new TrendingStoryDto(s.Id, s.Title, s.Category?.Title ?? string.Empty, s.CoverImageUrl, score, c, r, v, b);
            })
            .OrderByDescending(t => t.TrendScore)
            .Take(10)
            .ToList();

        // ── Most active users ────────────────────────────────────────────────
        var userComments = await _db.Comments
            .GroupBy(c => c.AuthorId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

        var userReactions = await _db.Reactions
            .GroupBy(r => r.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

        var userVotes = await _db.StoryVotes
            .GroupBy(v => v.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

        var userBookmarks = await _db.Bookmarks
            .GroupBy(b => b.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

        var allActiveUserIds = userComments.Keys
            .Union(userReactions.Keys)
            .Union(userVotes.Keys)
            .ToList();

        var activeUsers = await _db.Users
            .Where(u => allActiveUserIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FirstName, u.LastName, Email = u.Email ?? string.Empty, u.MentionHandle, u.CreatedAt })
            .ToListAsync(ct);

        var mostActiveUsers = activeUsers
            .Select(u =>
            {
                int c = userComments.GetValueOrDefault(u.Id, 0);
                int r = userReactions.GetValueOrDefault(u.Id, 0);
                int v = userVotes.GetValueOrDefault(u.Id, 0);
                int b = userBookmarks.GetValueOrDefault(u.Id, 0);
                return new UserActivityDto(u.Id, $"{u.FirstName} {u.LastName}", u.Email ?? string.Empty, u.MentionHandle, u.CreatedAt, c, r, v, b, c + r + v + b);
            })
            .OrderByDescending(u => u.TotalActivity)
            .Take(10)
            .ToList();

        // ── Category engagement ──────────────────────────────────────────────
        var publishedStories = await _db.Stories
            .AsNoTracking()
            .Include(s => s.Category)
            .Select(s => new { s.Id, s.CategoryId, CategoryTitle = s.Category!.Title, s.ViewCount })
            .ToListAsync(ct);

        var allPublishedIds = publishedStories.Select(s => s.Id).ToList();

        var catComments = await _db.Comments
            .Where(c => allPublishedIds.Contains(c.StoryId))
            .Join(_db.Stories, c => c.StoryId, s => s.Id, (c, s) => s.CategoryId)
            .GroupBy(catId => catId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count, ct);

        var catReactions = await _db.Reactions
            .Where(r => allPublishedIds.Contains(r.StoryId))
            .Join(_db.Stories, r => r.StoryId, s => s.Id, (r, s) => s.CategoryId)
            .GroupBy(catId => catId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count, ct);

        var catBookmarks = await _db.Bookmarks
            .Where(b => allPublishedIds.Contains(b.StoryId))
            .Join(_db.Stories, b => b.StoryId, s => s.Id, (b, s) => s.CategoryId)
            .GroupBy(catId => catId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count, ct);

        var categoryStats = publishedStories
            .GroupBy(s => new { s.CategoryId, s.CategoryTitle })
            .Select(g => new CategoryStatsDto(
                g.Key.CategoryId,
                g.Key.CategoryTitle,
                g.Count(),
                g.Sum(s => (long)s.ViewCount),
                catComments.GetValueOrDefault(g.Key.CategoryId, 0),
                catReactions.GetValueOrDefault(g.Key.CategoryId, 0),
                catBookmarks.GetValueOrDefault(g.Key.CategoryId, 0)
            ))
            .OrderByDescending(c => c.TotalViews)
            .ToList();

        // ── Reaction distribution ────────────────────────────────────────────
        var reactionDist = await _db.Reactions
            .GroupBy(r => r.ReactionType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var reactionDistribution = new ReactionDistributionDto(
            reactionDist.FirstOrDefault(r => r.Type == "Like")?.Count ?? 0,
            reactionDist.FirstOrDefault(r => r.Type == "Love")?.Count ?? 0,
            reactionDist.FirstOrDefault(r => r.Type == "Laugh")?.Count ?? 0
        );

        return Result<ReportDto>.Success(new ReportDto(
            overview,
            topStories,
            trendingStories,
            mostActiveUsers,
            categoryStats,
            reactionDistribution
        ));
    }
}
