using MediatR;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Admin;

public record GetUserByIdQuery(string UserId) : IRequest<Result<AdminUserDto>>;
