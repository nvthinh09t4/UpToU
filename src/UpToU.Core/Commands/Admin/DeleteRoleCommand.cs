using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Admin;

public record DeleteRoleCommand(string RoleName) : IRequest<Result<bool>>;
