using MediatR;
using Microsoft.AspNetCore.Identity;
using UpToU.Core.Commands.Admin;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Entities;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Admin;

public class GetUserByIdHandler : IRequestHandler<GetUserByIdQuery, Result<AdminUserDto>>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public GetUserByIdHandler(UserManager<ApplicationUser> userManager)
        => _userManager = userManager;

    public async Task<Result<AdminUserDto>> Handle(GetUserByIdQuery request, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user is null)
            return Result<AdminUserDto>.NotFound("User not found.");

        var roles = await _userManager.GetRolesAsync(user);
        return Result<AdminUserDto>.Success(new AdminUserDto(
            user.Id, user.Email!, user.FirstName, user.LastName,
            user.IsActive, user.EmailConfirmed,
            user.CreatedAt, user.LastLoginAt, roles));
    }
}
