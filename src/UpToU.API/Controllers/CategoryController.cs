using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Category;
using UpToU.Core.DTOs.Category;

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
}
