namespace UpToU.Core.DTOs;

public record UserDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    IList<string> Roles,
    int CreditBalance = 0,
    string? ActiveTitle = null,
    string? ActiveAvatarFrameUrl = null,
    string? AvatarUrl = null,
    string? FavoriteQuote = null,
    string? MentionHandle = null,
    string? DisplayName = null,
    DateTime? DisplayNameExpiresAt = null
);
