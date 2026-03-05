using MediatR;
using Microsoft.AspNetCore.Identity;
using UpToU.Core.Commands.Admin;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Entities;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Admin;

public class UpdateUserHandler : IRequestHandler<UpdateUserCommand, Result<AdminUserDto>>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UpdateUserHandler(UserManager<ApplicationUser> userManager)
        => _userManager = userManager;

    public async Task<Result<AdminUserDto>> Handle(UpdateUserCommand request, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user is null)
            return Result<AdminUserDto>.NotFound("User not found.");

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.IsActive = request.IsActive;
        user.EmailConfirmed = request.EmailConfirmed;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var errors = string.Join("; ", updateResult.Errors.Select(e => e.Description));
            return Result<AdminUserDto>.Failure(errors);
        }

        // Sync roles
        var currentRoles = await _userManager.GetRolesAsync(user);
        var toAdd = request.Roles.Except(currentRoles).ToList();
        var toRemove = currentRoles.Except(request.Roles).ToList();

        if (toAdd.Count > 0) await _userManager.AddToRolesAsync(user, toAdd);
        if (toRemove.Count > 0) await _userManager.RemoveFromRolesAsync(user, toRemove);

        var roles = await _userManager.GetRolesAsync(user);
        return Result<AdminUserDto>.Success(new AdminUserDto(
            user.Id, user.Email!, user.FirstName, user.LastName,
            user.IsActive, user.EmailConfirmed,
            user.CreatedAt, user.LastLoginAt, roles));
    }
}
