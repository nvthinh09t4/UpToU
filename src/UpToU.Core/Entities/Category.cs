namespace UpToU.Core.Entities;

public class Category
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
    public decimal ScoreWeight { get; set; } = 1m;
    public List<decimal> ScoreWeightHistory { get; set; } = new();
    public int OrderToShow { get; set; } = 0;

    public int? ParentId { get; set; }
    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();

    public ICollection<Story> Stories { get; set; } = new List<Story>();
}
