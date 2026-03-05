namespace UpToU.Core.DTOs;

public record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiry,
    UserDto User,
    string? RefreshToken = null
);
