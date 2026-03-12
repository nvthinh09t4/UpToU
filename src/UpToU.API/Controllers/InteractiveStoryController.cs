using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1")]
public class InteractiveStoryController : ControllerBase
{
    private readonly IMediator _mediator;
    public InteractiveStoryController(IMediator mediator) => _mediator = mediator;

    // ── Admin: Node Graph Management ──────────────────────────────────────────

    [HttpGet("admin/story-nodes/{detailId:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<StoryNodeGraphDto>> GetGraph(int detailId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetStoryNodeGraphQuery(detailId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("admin/story-nodes")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<StoryNodeDto>> UpsertNode([FromBody] UpsertStoryNodeCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("admin/story-nodes/{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> DeleteNode(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteStoryNodeCommand(id), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("admin/story-node-answers")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<StoryNodeAnswerDto>> UpsertAnswer([FromBody] UpsertStoryNodeAnswerCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("admin/story-node-answers/{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> DeleteAnswer(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteStoryNodeAnswerCommand(id), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Client: Interactive Play ──────────────────────────────────────────────

    [HttpGet("interactive-stories/{storyId:int}/progress")]
    [Authorize]
    public async Task<ActionResult<InteractiveStoryStateDto?>> GetProgress(int storyId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetInteractiveStoryProgressQuery(storyId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("interactive-stories/{storyId:int}/play")]
    [Authorize]
    public async Task<ActionResult<InteractiveStoryStateDto>> StartOrResume(int storyId, CancellationToken ct)
    {
        var result = await _mediator.Send(new StartOrResumeInteractiveStoryCommand(storyId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("interactive-stories/progress/{progressId:int}/answer")]
    [Authorize]
    public async Task<ActionResult<InteractiveStoryStateDto>> SubmitAnswer(
        int progressId,
        [FromBody] SubmitAnswerRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new SubmitStoryAnswerCommand(progressId, request.AnswerId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }
}

public record SubmitAnswerRequest(int AnswerId);
