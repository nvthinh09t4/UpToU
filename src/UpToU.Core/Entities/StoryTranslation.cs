namespace UpToU.Core.Entities;

public class StoryTranslation
{
    public int Id { get; set; }

    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;

    /// <summary>BCP-47 language code: "en" or "vi".</summary>
    public string Language { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Excerpt { get; set; }

    /// <summary>Full translated article content (HTML/Markdown). Null for interactive stories.</summary>
    public string? Content { get; set; }

    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
}
