using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Category;
using UpToU.Core.DTOs.Category;
using UpToU.Core.DTOs.Story;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1")]
public class CategoryController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoryController(IMediator mediator) => _mediator = mediator;

    // ── Public endpoints (client site) ───────────────────────────────────────

    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCategoriesQuery(ActiveOnly: true), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpGet("categories/{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetCategory(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCategoryByIdQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    [HttpGet("admin/categories")]
    [Authorize(Policy = "ContributorOrAbove")]
    public async Task<ActionResult<List<CategoryDto>>> GetAllCategories(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCategoriesQuery(ActiveOnly: false), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("admin/categories")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult<CategoryDto>> CreateCategory(
        [FromBody] CreateCategoryCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetCategory), new { id = result.Value!.Id }, result.Value)
            : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPut("admin/categories/{id:int}")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(
        int id,
        [FromBody] UpdateCategoryCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command with { Id = id }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("admin/categories/{id:int}")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult> DeleteCategory(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteCategoryCommand(id), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Score Types ───────────────────────────────────────────────────────────

    [HttpGet("admin/categories/{id:int}/score-types")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult<List<CategoryScoreTypeDto>>> GetScoreTypes(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCategoryScoreTypesQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("admin/categories/{id:int}/score-types")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult<CategoryScoreTypeDto>> UpsertScoreType(
        int id,
        [FromBody] UpsertCategoryScoreTypeCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command with { CategoryId = id }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("admin/categories/score-types/{scoreTypeId:int}")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult> DeleteScoreType(int scoreTypeId, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteCategoryScoreTypeCommand(scoreTypeId), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Badges ────────────────────────────────────────────────────────────────

    [HttpGet("categories/{id:int}/badges")]
    public async Task<ActionResult<List<CategoryBadgeDto>>> GetBadges(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCategoryBadgesQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpGet("admin/categories/{id:int}/badges")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult<List<CategoryBadgeDto>>> GetBadgesAdmin(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCategoryBadgesQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("admin/categories/{id:int}/badges")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult<CategoryBadgeDto>> UpsertBadge(
        int id,
        [FromBody] UpsertCategoryBadgeCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command with { CategoryId = id }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("admin/categories/badges/{badgeId:int}")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult> DeleteBadge(int badgeId, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteCategoryBadgeCommand(badgeId), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── User Badges ───────────────────────────────────────────────────────────

    [HttpGet("users/me/badges")]
    [Authorize]
    public async Task<ActionResult<List<UserCategoryBadgeDto>>> GetMyBadges(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _mediator.Send(new GetUserBadgesQuery(userId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }
}
