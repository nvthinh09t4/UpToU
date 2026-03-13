namespace UpToU.Core.Entities;

public class Story
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public string? Excerpt { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? AuthorName { get; set; }
    public bool IsFeatured { get; set; } = false;
    public DateTime? PublishDate { get; set; }
    public bool IsPublish { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public int ViewCount { get; set; } = 0;

    /// <summary>"Article" | "Interactive"</summary>
    public string StoryType { get; set; } = "Article";

    // ── Workflow ─────────────────────────────────────────────────────────────
    /// <summary>Id of the user (Contributor/Admin) who created this story.</summary>
    public string? AuthorId { get; set; }

    /// <summary>Workflow status: Draft | Submitted | Approved | Published | Rejected.</summary>
    public string Status { get; set; } = StoryStatus.Draft;

    public DateTime? SubmittedAt  { get; set; }
    public string?   ReviewedBy   { get; set; }
    public DateTime? ReviewedAt   { get; set; }
    public string?   RejectionReason { get; set; }

    /// <summary>Optional supervisor specifically assigned by the contributor to review this story.</summary>
    public string? AssignedSupervisorId { get; set; }

    // ── Score completion ──────────────────────────────────────────────────────
    /// <summary>The score type that gates story completion. When a user's score for this type reaches <see cref="MaxScoreValue"/>, the story ends and the user is marked as having finished it.</summary>
    public int? MaxScoreTypeId { get; set; }
    public CategoryScoreType? MaxScoreType { get; set; }

    /// <summary>Maximum score value for <see cref="MaxScoreTypeId"/>. Null means no score-based completion gate.</summary>
    public int? MaxScoreValue { get; set; }

    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    public ICollection<StoryDetail> StoryDetails { get; set; } = new List<StoryDetail>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
    public ICollection<StoryVote> StoryVotes { get; set; } = new List<StoryVote>();
    public ICollection<StoryTranslation> Translations { get; set; } = new List<StoryTranslation>();
}
