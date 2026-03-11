namespace UpToU.Core.DTOs.Story;

public record StoryDto(
    int Id,
    string Title,
    string? Slug,
    string? Description,
    string? Excerpt,
    string? CoverImageUrl,
    string? AuthorName,
    bool IsFeatured,
    DateTime? PublishDate,
    bool IsPublish,
    bool IsDeleted,
    string StoryType,
    int CategoryId,
    string CategoryTitle,
    DateTime CreatedOn,
    DateTime? ModifiedOn,
    string? CreatedBy,
    string? ModifiedBy,
    List<TagDto> Tags,
    StoryDetailDto? LatestDetail,
    int ViewCount,
    int UpvoteCount,
    int DownvoteCount,
    string? CurrentUserVote,
    bool IsBookmarked
);
