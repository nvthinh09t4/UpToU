using MediatR;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Admin;

public record UpdateUserCommand(
    string UserId,
    string FirstName,
    string LastName,
    bool IsActive,
    bool EmailConfirmed,
    IList<string> Roles
) : IRequest<Result<AdminUserDto>>;
