namespace UpToU.Core.Entities;

public class StoryNodeAnswer
{
    public int Id { get; set; }
    public int StoryNodeId { get; set; }
    public StoryNode StoryNode { get; set; } = null!;

    /// <summary>Answer text in English / default language.</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>Vietnamese translation of <see cref="Text"/>.</summary>
    public string? TextVi { get; set; }

    /// <summary>Legacy single-dimension points total (kept for backwards compatibility).</summary>
    public int PointsAwarded { get; set; }

    /// <summary>
    /// Per-score-type deltas awarded when this answer is chosen.
    /// Keys match <see cref="CategoryScoreType.Name"/> values (e.g. "capital", "experience", "mental", "health").
    /// Values may be negative.
    /// </summary>
    public Dictionary<string, int> ScoreDeltas { get; set; } = new();

    /// <summary>Null = end of story.</summary>
    public int? NextNodeId { get; set; }
    public StoryNode? NextNode { get; set; }

    public string? Color { get; set; }   // CSS hex color for the button
    public int SortOrder { get; set; }
}
