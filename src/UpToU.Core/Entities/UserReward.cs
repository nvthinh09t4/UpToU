namespace UpToU.Core.Entities;

public class UserReward
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public int RewardItemId { get; set; }
    public RewardItem RewardItem { get; set; } = null!;

    /// <summary>Whether this reward is currently equipped/active.</summary>
    public bool IsActive { get; set; }

    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;
}
