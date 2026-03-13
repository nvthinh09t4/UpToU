namespace UpToU.Core.Entities;

public class UserStoryProgress
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;

    /// <summary>Locked to the revision the user started with.</summary>
    public int StoryDetailId { get; set; }
    public StoryDetail StoryDetail { get; set; } = null!;

    /// <summary>Null when completed.</summary>
    public int? CurrentNodeId { get; set; }
    public StoryNode? CurrentNode { get; set; }

    public bool IsCompleted { get; set; }
    public int TotalPointsEarned { get; set; }

    /// <summary>
    /// Running per-score-type totals accumulated through the story.
    /// Keys match <see cref="CategoryScoreType.Name"/> values (e.g. "capital", "experience", "mental", "health").
    /// </summary>
    public Dictionary<string, int> ScoreTotals { get; set; } = new();

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserStoryAnswer> Answers { get; set; } = new List<UserStoryAnswer>();
}
