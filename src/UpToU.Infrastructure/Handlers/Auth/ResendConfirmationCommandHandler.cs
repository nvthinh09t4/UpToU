using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using UpToU.Core.Commands.Auth;
using UpToU.Core.Entities;
using UpToU.Core.Interfaces;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Auth;

public class ResendConfirmationCommandHandler : IRequestHandler<ResendConfirmationCommand, Result<bool>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailService _emailService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<ResendConfirmationCommandHandler> _logger;

    public ResendConfirmationCommandHandler(
        UserManager<ApplicationUser> userManager,
        IEmailService emailService,
        IHttpContextAccessor httpContextAccessor,
        ILogger<ResendConfirmationCommandHandler> logger)
    {
        _userManager = userManager;
        _emailService = emailService;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(ResendConfirmationCommand request, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        // Always return success to avoid email enumeration attacks
        if (user is null || user.EmailConfirmed)
            return Result<bool>.Success(true);

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
            _logger.LogWarning(ex, "Failed to resend confirmation email. {UserId} {Email}", user.Id, user.Email);
        }

        return Result<bool>.Success(true);
    }
}
