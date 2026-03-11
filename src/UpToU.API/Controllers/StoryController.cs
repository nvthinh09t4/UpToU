using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.DTOs.Vote;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1")]
public class StoryController : ControllerBase
{
    private readonly IMediator _mediator;

    public StoryController(IMediator mediator) => _mediator = mediator;

    // ── Public endpoints ──────────────────────────────────────────────────────

    [HttpGet("categories/{categoryId:int}/stories")]
    public async Task<ActionResult<List<StoryDto>>> GetStoriesByCategory(
        int categoryId,
        [FromQuery] string sortBy = "Newest",
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetStoriesByCategoryQuery(categoryId, sortBy), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpGet("stories/{id:int}")]
    public async Task<ActionResult<StoryDto>> GetStory(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetStoryByIdQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpGet("bookmarks")]
    [Authorize]
    public async Task<ActionResult<List<StoryDto>>> GetBookmarks(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetBookmarksQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("stories/{id:int}/bookmark")]
    [Authorize]
    public async Task<ActionResult<bool>> ToggleBookmark(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new ToggleBookmarkCommand(id), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("stories/{id:int}/vote")]
    [Authorize]
    public async Task<ActionResult<VoteResultDto>> VoteStory(
        int id,
        [FromBody] VoteStoryCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command with { StoryId = id }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpGet("tags")]
    public async Task<ActionResult<List<TagDto>>> GetTags(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetTagsQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    [HttpGet("admin/stories")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<List<StoryDto>>> GetAdminStories([FromQuery] int? categoryId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAdminStoriesQuery(categoryId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("admin/stories")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<StoryDto>> CreateStory([FromBody] CreateStoryCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetStory), new { id = result.Value!.Id }, result.Value)
            : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPut("admin/stories/{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<StoryDto>> UpdateStory(int id, [FromBody] UpdateStoryCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command with { Id = id }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("admin/stories/{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> DeleteStory(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteStoryCommand(id), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpGet("admin/stories/{storyId:int}/details")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<List<StoryDetailDto>>> GetStoryDetails(int storyId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetStoryDetailsQuery(storyId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("admin/stories/{storyId:int}/details")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<StoryDetailDto>> AddStoryDetail(
        int storyId,
        [FromBody] AddStoryDetailCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command with { StoryId = storyId }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Tag admin endpoints ───────────────────────────────────────────────────

    [HttpPost("admin/tags")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<TagDto>> CreateTag([FromBody] CreateTagCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("admin/tags/{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> DeleteTag(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteTagCommand(id), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }
}
