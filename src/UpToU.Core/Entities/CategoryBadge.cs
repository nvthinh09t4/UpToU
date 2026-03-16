namespace UpToU.Core.Entities;

public class CategoryBadge
{
    public int Id { get; set; }

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    /// <summary>Tier 1 (lowest) through 5 (highest). One badge per tier per category.</summary>
    public int Tier { get; set; }

    /// <summary>English badge label, e.g. "Apprentice".</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>Vietnamese label, e.g. "Tập sự".</summary>
    public string? LabelVi { get; set; }

    /// <summary>Minimum category score required to earn this badge.</summary>
    public int ScoreThreshold { get; set; }

    public string? BadgeImageUrl { get; set; }

    public ICollection<UserCategoryBadge> UserBadges { get; set; } = new List<UserCategoryBadge>();
}
