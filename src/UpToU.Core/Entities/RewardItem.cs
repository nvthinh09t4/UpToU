namespace UpToU.Core.Entities;

public class RewardItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Title | AvatarFrame | Avatar | StoryAccess</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Credits required to unlock.</summary>
    public int CreditCost { get; set; }

    /// <summary>URL for avatar/frame images, or the title text itself for Title rewards.</summary>
    public string? Value { get; set; }

    /// <summary>URL for preview thumbnail in the reward shop.</summary>
    public string? PreviewUrl { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserReward> UserRewards { get; set; } = new List<UserReward>();
}
