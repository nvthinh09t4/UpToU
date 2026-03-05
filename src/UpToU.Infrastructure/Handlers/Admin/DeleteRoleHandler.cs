using MediatR;
using Microsoft.AspNetCore.Identity;
using UpToU.Core.Commands.Admin;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Admin;

public class DeleteRoleHandler : IRequestHandler<DeleteRoleCommand, Result<bool>>
{
    private readonly RoleManager<IdentityRole> _roleManager;

    public DeleteRoleHandler(RoleManager<IdentityRole> roleManager)
        => _roleManager = roleManager;

    public async Task<Result<bool>> Handle(DeleteRoleCommand request, CancellationToken ct)
    {
        var role = await _roleManager.FindByNameAsync(request.RoleName);
        if (role is null)
            return Result<bool>.NotFound($"Role '{request.RoleName}' not found.");

        var result = await _roleManager.DeleteAsync(role);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return Result<bool>.Failure(errors);
        }

        return Result<bool>.Success(true);
    }
}
