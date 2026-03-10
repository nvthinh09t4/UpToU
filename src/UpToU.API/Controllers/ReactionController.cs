using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Reaction;
using UpToU.Core.DTOs.Reaction;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/stories/{storyId:int}/reactions")]
public class ReactionController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReactionController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<ReactionSummaryDto>> GetReactions(int storyId, CancellationToken ct)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var result = await _mediator.Send(new GetReactionsQuery(storyId, currentUserId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ReactionSummaryDto>> UpsertReaction(
        int storyId,
        [FromBody] UpsertReactionCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command with { StoryId = storyId }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }
}
