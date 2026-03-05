using MediatR;
using UpToU.Core.DTOs;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Auth;

public record ExternalLoginCallbackCommand(string ReturnUrl)
    : IRequest<Result<AuthResponse>>;
