using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Auth;

public record ResendConfirmationCommand(string Email)
    : IRequest<Result<bool>>;
