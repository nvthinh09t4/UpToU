namespace UpToU.Core.DTOs.Admin;

public record SiteOverviewDto(
    int TotalUsers,
    int NewUsersThisWeek,
    int NewUsersThisMonth,
    int TotalStories,
    int PublishedStories,
    long TotalViews,
    int TotalComments,
    int TotalReactions,
    int TotalVotes,
    int TotalBookmarks
);

public record StoryStatsDto(
    int Id,
    string Title,
    string CategoryTitle,
    string? CoverImageUrl,
    string? AuthorName,
    int ViewCount,
    int CommentCount,
    int ReactionCount,
    int UpvoteCount,
    int DownvoteCount,
    int BookmarkCount,
    DateTime? PublishDate
);

public record TrendingStoryDto(
    int Id,
    string Title,
    string CategoryTitle,
    string? CoverImageUrl,
    int TrendScore,
    int RecentComments,
    int RecentReactions,
    int RecentVotes,
    int RecentBookmarks
);

public record UserActivityDto(
    string Id,
    string Name,
    string Email,
    string? MentionHandle,
    DateTime CreatedAt,
    int CommentCount,
    int ReactionCount,
    int VoteCount,
    int BookmarkCount,
    int TotalActivity
);

public record CategoryStatsDto(
    int Id,
    string Title,
    int StoryCount,
    long TotalViews,
    int TotalComments,
    int TotalReactions,
    int TotalBookmarks
);

public record ReactionDistributionDto(
    int LikeCount,
    int LoveCount,
    int LaughCount
);

public record ReportDto(
    SiteOverviewDto Overview,
    List<StoryStatsDto> TopStories,
    List<TrendingStoryDto> TrendingStories,
    List<UserActivityDto> MostActiveUsers,
    List<CategoryStatsDto> CategoryStats,
    ReactionDistributionDto ReactionDistribution
);
