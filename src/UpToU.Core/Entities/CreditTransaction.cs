namespace UpToU.Core.Entities;

public class CreditTransaction
{
    public long Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    /// <summary>Positive = earned, negative = spent.</summary>
    public int Amount { get; set; }

    /// <summary>DailyLogin | StoryRead | CommentPost | ReceiveUpvote | RewardUnlock</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Optional reference (e.g. StoryId, CommentId, RewardItemId).</summary>
    public int? ReferenceId { get; set; }

    /// <summary>Category the credit was earned in (for per-category leaderboard).</summary>
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
