using MediatR;
using Microsoft.AspNetCore.Identity;
using UpToU.Core.Commands.Admin;
using UpToU.Core.Entities;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Admin;

public class DeleteUserHandler : IRequestHandler<DeleteUserCommand, Result<bool>>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public DeleteUserHandler(UserManager<ApplicationUser> userManager)
        => _userManager = userManager;

    public async Task<Result<bool>> Handle(DeleteUserCommand request, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user is null)
            return Result<bool>.NotFound("User not found.");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return Result<bool>.Failure(errors);
        }

        return Result<bool>.Success(true);
    }
}
