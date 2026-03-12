namespace UpToU.Core.DTOs.Progress;

public record CategoryCreditDto(int CategoryId, string CategoryTitle, int CreditsEarned);

public record DailyCreditDto(DateTime Date, int CreditsEarned);

public record InProgressStoryDto(
    int StoryId,
    string Title,
    string CategoryTitle,
    string? CoverImageUrl,
    int VisitedNodes,
    int TotalNodes,
    int PointsEarned,
    DateTime StartedAt,
    DateTime UpdatedAt
);

public record SuggestedStoryDto(
    int Id,
    string Title,
    string CategoryTitle,
    string? CoverImageUrl,
    int ViewCount
);

public record UserProgressDto(
    List<CategoryCreditDto>  CategoryCredits,
    List<DailyCreditDto>     DailyCredits,
    List<InProgressStoryDto> InProgressStories,
    List<SuggestedStoryDto>  SuggestedStories,
    List<SuggestedStoryDto>  TrendingStories,
    int TotalStarted,
    int TotalCompleted
);
