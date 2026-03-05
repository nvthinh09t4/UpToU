using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using UpToU.Core.Commands.Auth;
using UpToU.Core.DTOs;
using UpToU.Core.Entities;
using UpToU.Core.Interfaces;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Auth;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<UserDto>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailService _emailService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<RegisterCommandHandler> _logger;

    public RegisterCommandHandler(
        UserManager<ApplicationUser> userManager,
        IEmailService emailService,
        IHttpContextAccessor httpContextAccessor,
        ILogger<RegisterCommandHandler> logger)
    {
        _userManager = userManager;
        _emailService = emailService;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<Result<UserDto>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
            return Result<UserDto>.Conflict("An account with this email already exists.");

        var user = new ApplicationUser
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            UserName = request.Email,
            CreatedAt = DateTime.UtcNow
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Result<UserDto>.Failure(errors);
        }

        await _userManager.AddToRoleAsync(user, "User");

        var confirmationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var httpRequest = _httpContextAccessor.HttpContext!.Request;
        var baseUrl = $"{httpRequest.Scheme}://{httpRequest.Host}";
        var link = $"{baseUrl}/api/v1/auth/confirm-email?userId={user.Id}&token={Uri.EscapeDataString(confirmationToken)}";

        try
        {
            await _emailService.SendEmailConfirmationAsync(user.Email!, link, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send confirmation email. {UserId} {Email}", user.Id, user.Email);
        }

        var roles = await _userManager.GetRolesAsync(user);
        var userDto = new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, roles);
        return Result<UserDto>.Success(userDto);
    }
}
