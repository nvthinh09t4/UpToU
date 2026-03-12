namespace UpToU.Core.Entities;

public class UserBan
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    /// <summary>Global | Category</summary>
    public string BanType { get; set; } = string.Empty;

    /// <summary>Null for global bans; set for category-specific restrictions.</summary>
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    /// <summary>Reason shown to the user in their notification.</summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>Who issued the ban.</summary>
    public string IssuedBy { get; set; } = string.Empty;

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Null = permanent ban.</summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>Set when an admin lifts the ban early.</summary>
    public DateTime? RevokedAt { get; set; }
    public string? RevokedBy { get; set; }

    public bool IsActive => RevokedAt is null && (ExpiresAt is null || ExpiresAt > DateTime.UtcNow);
}
