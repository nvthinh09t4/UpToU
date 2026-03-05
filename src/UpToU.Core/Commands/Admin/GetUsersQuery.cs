using MediatR;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Admin;

public record GetUsersQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? Role = null
) : IRequest<Result<PagedResult<AdminUserDto>>>;
