using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Admin;

public record DeleteUserCommand(string UserId) : IRequest<Result<bool>>;
