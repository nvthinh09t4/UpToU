namespace UpToU.Core.DTOs.Admin;

public record AdminUserDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    bool IsActive,
    bool EmailConfirmed,
    DateTime CreatedAt,
    DateTime? LastLoginAt,
    IList<string> Roles
);
