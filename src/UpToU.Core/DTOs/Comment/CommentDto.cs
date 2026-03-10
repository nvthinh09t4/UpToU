namespace UpToU.Core.DTOs.Comment;

public record CommentAuthorDto(string Id, string Name, string? MentionHandle);

public record CommentDto(
    int Id,
    int StoryId,
    CommentAuthorDto Author,
    string Body,
    int? ParentCommentId,
    DateTime CreatedAt,
    DateTime? EditedAt,
    List<CommentDto> Replies,
    int UpvoteCount,
    int DownvoteCount,
    string? CurrentUserVote
);
