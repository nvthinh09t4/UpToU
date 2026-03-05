using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Admin;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Entities;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Admin;

public class GetUsersHandler : IRequestHandler<GetUsersQuery, Result<PagedResult<AdminUserDto>>>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public GetUsersHandler(UserManager<ApplicationUser> userManager)
        => _userManager = userManager;

    public async Task<Result<PagedResult<AdminUserDto>>> Handle(GetUsersQuery request, CancellationToken ct)
    {
        var query = _userManager.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.ToLower();
            query = query.Where(u =>
                u.Email!.ToLower().Contains(s) ||
                u.FirstName.ToLower().Contains(s) ||
                u.LastName.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync(ct);

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var items = new List<AdminUserDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);

            if (!string.IsNullOrWhiteSpace(request.Role) &&
                !roles.Contains(request.Role, StringComparer.OrdinalIgnoreCase))
                continue;

            items.Add(new AdminUserDto(
                user.Id, user.Email!, user.FirstName, user.LastName,
                user.IsActive, user.EmailConfirmed,
                user.CreatedAt, user.LastLoginAt, roles));
        }

        return Result<PagedResult<AdminUserDto>>.Success(
            new PagedResult<AdminUserDto>(items, totalCount, request.Page, request.PageSize));
    }
}
