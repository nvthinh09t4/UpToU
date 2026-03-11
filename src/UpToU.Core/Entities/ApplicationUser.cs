using Microsoft.AspNetCore.Identity;

namespace UpToU.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public string? MentionHandle { get; set; }

    // ── Credit / reward system ──────────────────────────────────────────────────
    public int CreditBalance { get; set; }
    public string? ActiveTitle { get; set; }
    public string? ActiveAvatarFrameUrl { get; set; }
    public string? AvatarUrl { get; set; }
    public string? FavoriteQuote { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<CreditTransaction> CreditTransactions { get; set; } = new List<CreditTransaction>();
    public ICollection<UserReward> UserRewards { get; set; } = new List<UserReward>();
}
