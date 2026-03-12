namespace UpToU.Core.DTOs.Admin;

public record RecentUserDto(
    string Id,
    string FirstName,
    string LastName,
    string Email,
    DateTime CreatedAt,
    bool IsActive
);

public record RecentStoryDto(
    int Id,
    string Title,
    string CategoryTitle,
    int ViewCount,
    DateTime? PublishDate
);

public record DashboardStatsDto(
    // Users
    int TotalUsers,
    int RegisteredToday,
    int LoggedInToday,
    int TotalRoles,
    int ActiveUsers,
    // Content
    int TotalStories,
    int PublishedStories,
    int StoriesThisWeek,
    long TotalComments,
    long TotalReactions,
    // Recent activity
    List<RecentUserDto>  RecentUsers,
    List<RecentStoryDto> RecentStories
);
