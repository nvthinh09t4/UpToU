namespace UpToU.Core.Entities;

public class StoryNodeAnswer
{
    public int Id { get; set; }
    public int StoryNodeId { get; set; }
    public StoryNode StoryNode { get; set; } = null!;

    public string Text { get; set; } = string.Empty;

    /// <summary>Credits (category points) awarded when this answer is chosen.</summary>
    public int PointsAwarded { get; set; }

    /// <summary>Null = end of story.</summary>
    public int? NextNodeId { get; set; }
    public StoryNode? NextNode { get; set; }

    public string? Color { get; set; }   // CSS hex color for the button
    public int SortOrder { get; set; }
}
