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

    /// <summary>
    /// When true this reward is awarded automatically and cannot be purchased from the shop
    /// (e.g. the Contributor Champion exclusive title for the #1 on the contributor leaderboard).
    /// </summary>
    public bool IsExclusive { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserReward> UserRewards { get; set; } = new List<UserReward>();
}
