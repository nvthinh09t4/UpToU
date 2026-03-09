using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Comment;
using UpToU.Core.DTOs.Comment;
using UpToU.Core.DTOs.Vote;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/stories/{storyId:int}/comments")]
public class CommentController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommentController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<List<CommentDto>>> GetComments(
        int storyId,
        [FromQuery] string sortBy = "Newest",
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetCommentsQuery(storyId, sortBy), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<CommentDto>> PostComment(
        int storyId,
        [FromBody] PostCommentCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command with { StoryId = storyId }, ct);
        return result.IsSuccess
            ? StatusCode(201, result.Value)
            : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("{commentId:int}")]
    [Authorize]
    public async Task<ActionResult> DeleteComment(int commentId, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteCommentCommand(commentId), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("{commentId:int}/vote")]
    [Authorize]
    public async Task<ActionResult<VoteResultDto>> VoteComment(
        int commentId,
        [FromBody] VoteCommentCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command with { CommentId = commentId }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }
}
