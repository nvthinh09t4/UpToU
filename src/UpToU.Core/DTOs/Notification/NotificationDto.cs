namespace UpToU.Core.DTOs.Notification;

public record NotificationDto(
    int Id,
    string Type,
    int StoryId,
    int CommentId,
    string ActorName,
    bool IsRead,
    DateTime CreatedAt
);
