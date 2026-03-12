using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UpToU.Core.Commands.Auth;
using UpToU.Core.DTOs;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _db;

    public AuthController(IMediator mediator, UserManager<ApplicationUser> userManager, ApplicationDbContext db)
    {
        _mediator = mediator;
        _userManager = userManager;
        _db = db;
    }

    [HttpPost("register")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<UserDto>> Register(
        [FromBody] RegisterCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess
            ? Created(string.Empty, result.Value)
            : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("confirm-email")]
    public async Task<ActionResult> ConfirmEmail(
        [FromBody] ConfirmEmailCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? Ok() : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("resend-confirmation")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult> ResendConfirmation(
        [FromBody] ResendConfirmationCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? Ok() : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("login")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        if (!result.IsSuccess)
            return Problem(result.Error, statusCode: result.StatusCode);

        SetRefreshTokenCookie(result.Value!.RefreshToken!);
        var response = result.Value with { RefreshToken = null };
        return Ok(response);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(CancellationToken ct)
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized();

        var result = await _mediator.Send(new RefreshTokenCommand(refreshToken), ct);
        if (!result.IsSuccess)
            return Problem(result.Error, statusCode: result.StatusCode);

        SetRefreshTokenCookie(result.Value!.RefreshToken!);
        var response = result.Value with { RefreshToken = null };
        return Ok(response);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout(CancellationToken ct)
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(refreshToken))
            await _mediator.Send(new LogoutCommand(refreshToken), ct);

        Response.Cookies.Delete("refreshToken");
        return NoContent();
    }

    [HttpGet("external-login")]
    public IActionResult ExternalLogin([FromQuery] string provider, [FromQuery] string returnUrl)
    {
        var redirectUrl = Url.Action(nameof(ExternalCallback), "Auth",
            new { returnUrl }, Request.Scheme)!;

        var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(properties, provider);
    }

    [HttpGet("external-callback")]
    public async Task<IActionResult> ExternalCallback(
        [FromQuery] string returnUrl,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new ExternalLoginCallbackCommand(returnUrl), ct);
        if (!result.IsSuccess)
            return Redirect($"{returnUrl}?error={Uri.EscapeDataString(result.Error)}");

        SetRefreshTokenCookie(result.Value!.RefreshToken!);

        var redirectTarget = $"{returnUrl}?accessToken={Uri.EscapeDataString(result.Value.AccessToken)}";
        return Redirect(redirectTarget);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new UserDto(
            user.Id, user.Email ?? string.Empty,
            user.FirstName, user.LastName, roles,
            user.CreditBalance, user.ActiveTitle,
            user.ActiveAvatarFrameUrl, user.AvatarUrl,
            user.FavoriteQuote, user.MentionHandle, user.DisplayName,
            user.DisplayNameExpiresAt
        ));
    }

    [HttpGet("me/stats")]
    [Authorize]
    public async Task<ActionResult<UserStatsDto>> MyStats(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // All-time credits earned (sum of positive transactions only)
        var allTimeCredits = await _db.CreditTransactions
            .Where(t => t.UserId == userId && t.Amount > 0)
            .SumAsync(t => t.Amount, ct);

        // Leaderboard rank — position among all users by all-time earned credits
        var higherCount = await _db.CreditTransactions
            .Where(t => t.Amount > 0)
            .GroupBy(t => t.UserId)
            .Select(g => new { UserId = g.Key, Total = g.Sum(t => t.Amount) })
            .CountAsync(u => u.Total > allTimeCredits, ct);

        var leaderboardPosition = higherCount + 1;

        return Ok(new UserStatsDto(allTimeCredits, leaderboardPosition));
    }

    [HttpPatch("profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateProfile(
        [FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        if (request.FavoriteQuote is not null)
            user.FavoriteQuote = request.FavoriteQuote.Trim().Length == 0
                ? null
                : request.FavoriteQuote.Trim()[..Math.Min(request.FavoriteQuote.Trim().Length, 200)];

        await _userManager.UpdateAsync(user);
        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new UserDto(
            user.Id, user.Email ?? string.Empty,
            user.FirstName, user.LastName, roles,
            user.CreditBalance, user.ActiveTitle,
            user.ActiveAvatarFrameUrl, user.AvatarUrl,
            user.FavoriteQuote, user.MentionHandle, user.DisplayName,
            user.DisplayNameExpiresAt
        ));
    }

    [HttpPatch("profile/display-name")]
    [Authorize]
    public async Task<ActionResult<UserDto>> ChangeDisplayName(
        [FromBody] ChangeDisplayNameRequest request,
        CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // Require a NameChange ticket
        var ticket = await _db.UserRewards
            .Include(ur => ur.RewardItem)
            .Where(ur => ur.UserId == userId && ur.RewardItem.Category == "NameChange")
            .FirstOrDefaultAsync(ct);

        if (ticket is null)
            return Problem("You need a Name Change Ticket to change your display name.",
                statusCode: StatusCodes.Status400BadRequest);

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        // Duration in days is stored in RewardItem.Value; default 30 days
        var durationDays = int.TryParse(ticket.RewardItem.Value, out var d) && d > 0 ? d : 30;

        var trimmed = request.DisplayName.Trim();
        user.DisplayName = trimmed.Length == 0 ? null : trimmed[..Math.Min(trimmed.Length, 100)];
        user.DisplayNameExpiresAt = DateTime.UtcNow.AddDays(durationDays);

        // Consume the ticket (delete so it can be repurchased)
        _db.UserRewards.Remove(ticket);

        await _userManager.UpdateAsync(user);
        await _db.SaveChangesAsync(ct);

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserDto(
            user.Id, user.Email ?? string.Empty,
            user.FirstName, user.LastName, roles,
            user.CreditBalance, user.ActiveTitle,
            user.ActiveAvatarFrameUrl, user.AvatarUrl,
            user.FavoriteQuote, user.MentionHandle, user.DisplayName,
            user.DisplayNameExpiresAt
        ));
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });
    }
}

public record UpdateProfileRequest(string? FavoriteQuote);
public record ChangeDisplayNameRequest(string DisplayName);
public record UserStatsDto(int AllTimeCredits, int LeaderboardPosition);
