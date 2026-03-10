namespace UpToU.Core.Entities;

public class StoryVote
{
    public int Id { get; set; }
    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public string VoteType { get; set; } = string.Empty; // "Up" | "Down"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
