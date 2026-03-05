using MediatR;
using UpToU.Core.DTOs;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Auth;

public record LoginCommand(string Email, string Password)
    : IRequest<Result<AuthResponse>>;
