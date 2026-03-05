using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Admin;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Entities;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Admin;

public class GetDashboardStatsHandler : IRequestHandler<GetDashboardStatsQuery, Result<DashboardStatsDto>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public GetDashboardStatsHandler(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task<Result<DashboardStatsDto>> Handle(GetDashboardStatsQuery request, CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;

        var totalUsers = await _userManager.Users.CountAsync(ct);
        var registeredToday = await _userManager.Users
            .CountAsync(u => u.CreatedAt >= today, ct);
        var loggedInToday = await _userManager.Users
            .CountAsync(u => u.LastLoginAt != null && u.LastLoginAt >= today, ct);
        var activeUsers = await _userManager.Users
            .CountAsync(u => u.IsActive, ct);
        var totalRoles = await _roleManager.Roles.CountAsync(ct);

        return Result<DashboardStatsDto>.Success(new DashboardStatsDto(
            totalUsers,
            registeredToday,
            loggedInToday,
            totalRoles,
            activeUsers
        ));
    }
}
