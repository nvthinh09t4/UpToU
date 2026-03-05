using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Admin;

public record GetRolesQuery : IRequest<Result<IList<string>>>;
