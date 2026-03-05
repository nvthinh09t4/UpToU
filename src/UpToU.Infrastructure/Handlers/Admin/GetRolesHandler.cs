using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Admin;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Admin;

public class GetRolesHandler : IRequestHandler<GetRolesQuery, Result<IList<string>>>
{
    private readonly RoleManager<IdentityRole> _roleManager;

    public GetRolesHandler(RoleManager<IdentityRole> roleManager)
        => _roleManager = roleManager;

    public async Task<Result<IList<string>>> Handle(GetRolesQuery request, CancellationToken ct)
    {
        var roles = await _roleManager.Roles
            .AsNoTracking()
            .Select(r => r.Name!)
            .OrderBy(n => n)
            .ToListAsync(ct);

        return Result<IList<string>>.Success(roles);
    }
}
