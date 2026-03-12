using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Progress;
using UpToU.Core.DTOs.Progress;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/me/progress")]
[Authorize]
public class ProgressController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProgressController(IMediator mediator) => _mediator = mediator;

    /// <summary>Returns the authenticated user's learning progress and content recommendations.</summary>
    [HttpGet]
    public async Task<ActionResult<UserProgressDto>> GetProgress(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _mediator.Send(new GetUserProgressQuery(userId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }
}
