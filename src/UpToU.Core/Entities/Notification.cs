namespace UpToU.Core.Entities;

public class Notification
{
    public int Id { get; set; }
    public string RecipientId { get; set; } = string.Empty;
    public ApplicationUser Recipient { get; set; } = null!;
    public string Type { get; set; } = string.Empty; // "Mention" | "Reply"
    public int StoryId { get; set; }
    public int CommentId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
