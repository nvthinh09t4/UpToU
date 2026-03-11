namespace UpToU.Core.DTOs.Admin;

public record UserBanDto(
    int Id,
    string UserId,
    string UserEmail,
    string UserName,
    string BanType,
    int? CategoryId,
    string? CategoryTitle,
    string Reason,
    string IssuedBy,
    DateTime IssuedAt,
    DateTime? ExpiresAt,
    DateTime? RevokedAt,
    string? RevokedBy,
    bool IsActive
);
