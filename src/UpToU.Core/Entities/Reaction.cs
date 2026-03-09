namespace UpToU.Core.Entities;

public class Reaction
{
    public int Id { get; set; }
    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public string ReactionType { get; set; } = string.Empty; // "Like" | "Love" | "Laugh"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
