namespace UpToU.Core.DTOs;

public record UserDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    IList<string> Roles
);
