using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Admin;

public record CreateRoleCommand(string RoleName) : IRequest<Result<bool>>;
