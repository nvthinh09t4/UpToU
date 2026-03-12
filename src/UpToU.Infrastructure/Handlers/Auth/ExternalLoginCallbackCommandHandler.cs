using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Identity;
using UpToU.Core.Commands.Auth;
using UpToU.Core.DTOs;
using UpToU.Core.Entities;
using UpToU.Core.Interfaces;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Auth;

public class ExternalLoginCallbackCommandHandler
    : IRequestHandler<ExternalLoginCallbackCommand, Result<AuthResponse>>
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly ApplicationDbContext _db;

    public ExternalLoginCallbackCommandHandler(
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        ApplicationDbContext db)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _tokenService = tokenService;
        _db = db;
    }

    public async Task<Result<AuthResponse>> Handle(
        ExternalLoginCallbackCommand request, CancellationToken ct)
    {
        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info is null)
            return Result<AuthResponse>.Failure("External login failed — no provider info.");

        var signInResult = await _signInManager.ExternalLoginSignInAsync(
            info.LoginProvider, info.ProviderKey, isPersistent: false);

        ApplicationUser user;

        if (!signInResult.Succeeded)
        {
            var email = info.Principal.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Result<AuthResponse>.Failure("Could not retrieve email from external provider.");

            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser is not null)
            {
                user = existingUser;
                await _userManager.AddLoginAsync(user, info);
            }
            else
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true,
                    FirstName = info.Principal.FindFirstValue(ClaimTypes.GivenName) ?? string.Empty,
                    LastName = info.Principal.FindFirstValue(ClaimTypes.Surname) ?? string.Empty,
                    CreatedAt = DateTime.UtcNow
                };

                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    return Result<AuthResponse>.Failure("Could not create account from external provider.");

                await _userManager.AddToRoleAsync(user, "User");
                await _userManager.AddLoginAsync(user, info);
            }
        }
        else
        {
            var foundUser = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
            if (foundUser is null)
                return Result<AuthResponse>.Failure("User not found after external sign-in.");
            user = foundUser;
        }

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken(user.Id);

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync(ct);

        var jwtExpiry = DateTime.UtcNow.AddMinutes(15);
        var userDto = new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, roles,
            user.CreditBalance, user.ActiveTitle, user.ActiveAvatarFrameUrl, user.AvatarUrl,
            DisplayName: user.DisplayName, DisplayNameExpiresAt: user.DisplayNameExpiresAt);
        return Result<AuthResponse>.Success(new AuthResponse(accessToken, jwtExpiry, userDto, refreshToken.Token));
    }
}
