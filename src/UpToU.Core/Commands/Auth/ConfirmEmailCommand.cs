using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Auth;

public record ConfirmEmailCommand(string UserId, string Token)
    : IRequest<Result<bool>>;
