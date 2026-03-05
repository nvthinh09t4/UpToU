using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using UpToU.Core.Commands.Auth;
using UpToU.Core.DTOs;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

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
    public ActionResult<UserDto> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var userDto = new UserDto(
            userId,
            User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
            User.FindFirstValue("firstName") ?? string.Empty,
            User.FindFirstValue("lastName") ?? string.Empty,
            User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList()
        );

        return Ok(userDto);
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
