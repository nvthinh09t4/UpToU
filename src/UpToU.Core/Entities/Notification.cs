namespace UpToU.Core.Entities;

public class Notification
{
    public int Id { get; set; }
    public string RecipientId { get; set; } = string.Empty;
    public ApplicationUser Recipient { get; set; } = null!;

    /// <summary>Mention | Reply | Ban | Restrict | System</summary>
    public string Type { get; set; } = string.Empty;

    public int StoryId { get; set; }
    public int CommentId { get; set; }
    public string ActorName { get; set; } = string.Empty;

    /// <summary>Extra message body for ban/system notifications.</summary>
    public string? Message { get; set; }

    public bool IsRead { get; set; } = false;

    /// <summary>Moved to archive by user (auto-deleted after 5 days).</summary>
    public bool IsArchived { get; set; } = false;
    public DateTime? ArchivedAt { get; set; }

    /// <summary>Marked important by user or admin — never auto-deleted.</summary>
    public bool IsImportant { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
