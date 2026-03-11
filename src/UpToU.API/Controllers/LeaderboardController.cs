using MediatR;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Leaderboard;
using UpToU.Core.DTOs.Leaderboard;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/leaderboard")]
public class LeaderboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public LeaderboardController(IMediator mediator) => _mediator = mediator;

    /// <summary>Overall leaderboard by total credits earned.</summary>
    [HttpGet("overall")]
    public async Task<ActionResult<LeaderboardDto>> GetOverall(
        [FromQuery] string timePeriod = "AllTime",
        [FromQuery] int top = 50,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetOverallLeaderboardQuery(timePeriod, top), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    /// <summary>Leaderboard for a specific category.</summary>
    [HttpGet("categories/{categoryId:int}")]
    public async Task<ActionResult<LeaderboardDto>> GetByCategory(
        int categoryId,
        [FromQuery] string timePeriod = "AllTime",
        [FromQuery] int top = 50,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetCategoryLeaderboardQuery(categoryId, timePeriod, top), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    /// <summary>Leaderboard ranked by most activities (most earning transactions).</summary>
    [HttpGet("most-active")]
    public async Task<ActionResult<LeaderboardDto>> GetMostActive(
        [FromQuery] string timePeriod = "AllTime",
        [FromQuery] int top = 50,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetMostActiveLeaderboardQuery(timePeriod, top), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    /// <summary>Combined summary: overall + most active (compact, top N).</summary>
    [HttpGet("summary")]
    public async Task<ActionResult<LeaderboardSummaryDto>> GetSummary(
        [FromQuery] string timePeriod = "AllTime",
        [FromQuery] int top = 10,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetLeaderboardSummaryQuery(timePeriod, top), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }
}
