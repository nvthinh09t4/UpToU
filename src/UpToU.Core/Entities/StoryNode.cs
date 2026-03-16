namespace UpToU.Core.Entities;

public class StoryNode
{
    public int Id { get; set; }
    public int StoryDetailId { get; set; }
    public StoryDetail StoryDetail { get; set; } = null!;

    /// <summary>The question/prompt shown to the user (English / default language).</summary>
    public string Question { get; set; } = string.Empty;
    public string? QuestionSubtitle { get; set; }

    /// <summary>Vietnamese translation of <see cref="Question"/>.</summary>
    public string? QuestionVi { get; set; }
    public string? QuestionSubtitleVi { get; set; }

    /// <summary>True for the single entry-point node in this revision.</summary>
    public bool IsStart { get; set; }

    // Display config
    public string? BackgroundImageUrl { get; set; }
    public string? BackgroundColor { get; set; }     // CSS hex color e.g. "#1a1a2e"
    public string? VideoUrl { get; set; }             // YouTube or direct URL
    public string? AnimationType { get; set; }        // "fade" | "slide-left" | "zoom" | null

    public int SortOrder { get; set; }

    public ICollection<StoryNodeAnswer> Answers { get; set; } = new List<StoryNodeAnswer>();
}
