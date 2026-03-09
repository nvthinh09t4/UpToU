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

    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    public ICollection<StoryDetail> StoryDetails { get; set; } = new List<StoryDetail>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
    public ICollection<StoryVote> StoryVotes { get; set; } = new List<StoryVote>();
}
