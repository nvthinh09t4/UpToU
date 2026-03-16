namespace UpToU.Core.Entities;

public class UserCategoryBadge
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public int BadgeId { get; set; }
    public CategoryBadge Badge { get; set; } = null!;

    public DateTime AwardedAt { get; set; } = DateTime.UtcNow;
}
