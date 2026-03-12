namespace UpToU.Core.Entities;

/// <summary>
/// Records a single "contributed point" awarded to a story's author
/// when a reader finishes (reads or completes) that story.
/// </summary>
public class ContributedPointTransaction
{
    public int Id { get; set; }

    /// <summary>The user who authored the story and receives the point.</summary>
    public string AuthorId { get; set; } = string.Empty;

    /// <summary>The user who finished reading / completing the story.</summary>
    public string ReaderId { get; set; } = string.Empty;

    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;

    /// <summary>Points awarded to the author (always 1 per unique reader completion).</summary>
    public int Points { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
