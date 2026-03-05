using MediatR;
using Microsoft.AspNetCore.Identity;
using UpToU.Core.Commands.Admin;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Admin;

public class CreateRoleHandler : IRequestHandler<CreateRoleCommand, Result<bool>>
{
    private readonly RoleManager<IdentityRole> _roleManager;

    public CreateRoleHandler(RoleManager<IdentityRole> roleManager)
        => _roleManager = roleManager;

    public async Task<Result<bool>> Handle(CreateRoleCommand request, CancellationToken ct)
    {
        if (await _roleManager.RoleExistsAsync(request.RoleName))
            return Result<bool>.Conflict($"Role '{request.RoleName}' already exists.");

        var result = await _roleManager.CreateAsync(new IdentityRole(request.RoleName));
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return Result<bool>.Failure(errors);
        }

        return Result<bool>.Success(true);
    }
}
