namespace UpToU.Core.DTOs.Story;

public record StoryRatingDto(
    int StoryId,
    double AverageRating,
    int RatingCount,
    int? MyRating,
    string? MyComment
);

public record RecommendedStoryDto(
    int Id,
    string Title,
    string? Slug,
    string? Excerpt,
    string? CoverImageUrl,
    string StoryType,
    int CategoryId,
    string CategoryTitle,
    double AverageRating,
    int RatingCount,
    int ViewCount,
    string ReasonCategory
);
