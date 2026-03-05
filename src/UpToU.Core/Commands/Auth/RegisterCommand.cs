using MediatR;
using UpToU.Core.DTOs;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Auth;

public record RegisterCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password
) : IRequest<Result<UserDto>>;
