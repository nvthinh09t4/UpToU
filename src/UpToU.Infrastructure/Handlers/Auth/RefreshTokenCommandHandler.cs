using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Auth;
using UpToU.Core.DTOs;
using UpToU.Core.Entities;
using UpToU.Core.Interfaces;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Auth;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly ApplicationDbContext _db;

    public RefreshTokenCommandHandler(
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        ApplicationDbContext db)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _db = db;
    }

    public async Task<Result<AuthResponse>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var oldRefreshToken = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == request.Token, ct);

        if (oldRefreshToken is null || !oldRefreshToken.IsActive)
            return Result<AuthResponse>.Unauthorized("Invalid or expired refresh token.");

        var user = await _userManager.FindByIdAsync(oldRefreshToken.UserId);
        if (user is null)
            return Result<AuthResponse>.Unauthorized("User not found.");

        var newRefreshToken = _tokenService.GenerateRefreshToken(user.Id);
        oldRefreshToken.RevokedAt = DateTime.UtcNow;
        oldRefreshToken.ReplacedByToken = newRefreshToken.Token;

        _db.RefreshTokens.Add(newRefreshToken);
        await _db.SaveChangesAsync(ct);

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var jwtExpiry = DateTime.UtcNow.AddMinutes(15);

        var userDto = new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, roles);
        return Result<AuthResponse>.Success(new AuthResponse(accessToken, jwtExpiry, userDto, newRefreshToken.Token));
    }
}
