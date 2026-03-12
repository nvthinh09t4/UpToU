namespace UpToU.Core.Entities;

public class Bookmark
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
