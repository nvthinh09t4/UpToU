using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Auth;

public record LogoutCommand(string RefreshToken)
    : IRequest<Result<bool>>;
