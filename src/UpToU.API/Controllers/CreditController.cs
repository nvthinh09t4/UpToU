using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Credit;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/credits")]
public class CreditController : ControllerBase
{
    private readonly IMediator _mediator;

    public CreditController(IMediator mediator) => _mediator = mediator;

    [HttpGet("balance")]
    [Authorize]
    public async Task<ActionResult<CreditBalanceDto>> GetBalance(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCreditBalanceQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpGet("history")]
    [Authorize]
    public async Task<ActionResult<CreditHistoryDto>> GetHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetCreditHistoryQuery(page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpGet("rewards")]
    public async Task<ActionResult<List<RewardItemDto>>> GetRewards(
        [FromQuery] string? category = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetRewardsQuery(category), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("rewards/{id:int}/unlock")]
    [Authorize]
    public async Task<ActionResult<CreditBalanceDto>> UnlockReward(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new UnlockRewardCommand(id), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("rewards/{id:int}/activate")]
    [Authorize]
    public async Task<ActionResult<CreditBalanceDto>> SetActiveReward(
        int id,
        [FromQuery] bool activate = true,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new SetActiveRewardCommand(id, activate), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("claim/daily-login")]
    [Authorize]
    public async Task<ActionResult<CreditTransactionDto>> ClaimDailyLogin(CancellationToken ct)
    {
        var result = await _mediator.Send(new ClaimDailyLoginCommand(), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("claim/story-read/{storyId:int}")]
    [Authorize]
    public async Task<ActionResult<CreditTransactionDto>> ClaimStoryRead(int storyId, CancellationToken ct)
    {
        var result = await _mediator.Send(new ClaimStoryReadCommand(storyId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }
}
