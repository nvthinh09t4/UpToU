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

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly ApplicationDbContext _db;

    public LoginCommandHandler(
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        ApplicationDbContext db)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _db = db;
    }

    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return Result<AuthResponse>.Unauthorized("Invalid credentials.");

        if (!user.EmailConfirmed)
            return Result<AuthResponse>.Failure("Email not confirmed. Please check your inbox.", 403);

        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
            return Result<AuthResponse>.Unauthorized("Invalid credentials.");

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken(user.Id);

        var oldTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(ct);
        foreach (var oldToken in oldTokens)
            oldToken.RevokedAt = DateTime.UtcNow;

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync(ct);

        var userDto = new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, roles,
            user.CreditBalance, user.ActiveTitle, user.ActiveAvatarFrameUrl, user.AvatarUrl,
            DisplayName: user.DisplayName, DisplayNameExpiresAt: user.DisplayNameExpiresAt);
        var jwtExpiry = DateTime.UtcNow.AddMinutes(15);
        return Result<AuthResponse>.Success(new AuthResponse(accessToken, jwtExpiry, userDto, refreshToken.Token));
    }
}
