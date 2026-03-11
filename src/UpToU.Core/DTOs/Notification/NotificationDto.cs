namespace UpToU.Core.DTOs.Notification;

public record NotificationDto(
    int Id,
    string Type,
    int StoryId,
    int CommentId,
    string ActorName,
    string? Message,
    bool IsRead,
    bool IsArchived,
    bool IsImportant,
    DateTime CreatedAt
);
