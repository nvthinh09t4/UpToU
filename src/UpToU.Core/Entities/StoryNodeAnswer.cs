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

    /// <summary>Total number of times any player has selected this answer.</summary>
    public int ChoiceCount { get; set; }

    /// <summary>English explanation shown in the feedback popup after the player selects this answer.</summary>
    public string? Feedback { get; set; }

    /// <summary>Vietnamese translation of <see cref="Feedback"/>.</summary>
    public string? FeedbackVi { get; set; }

    /// <summary>
    /// Weighted probability branches for random next-node selection.
    /// Keys = target NodeId (as string), Values = relative integer weight.
    /// Empty dictionary = deterministic (use <see cref="NextNodeId"/> directly).
    /// When populated, <see cref="NextNodeId"/> should be null.
    /// </summary>
    public Dictionary<string, int> BranchWeights { get; set; } = new();
}
