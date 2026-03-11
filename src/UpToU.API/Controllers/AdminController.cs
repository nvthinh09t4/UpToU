using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Admin;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.DTOs.Credit;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator) => _mediator = mediator;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboard(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetDashboardStatsQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<ActionResult<PagedResult<AdminUserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetUsersQuery(page, pageSize, search, role), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpGet("users/{id}")]
    public async Task<ActionResult<AdminUserDto>> GetUser(string id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetUserByIdQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPut("users/{id}")]
    public async Task<ActionResult<AdminUserDto>> UpdateUser(
        string id,
        [FromBody] UpdateUserCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command with { UserId = id }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("users/{id}")]
    public async Task<ActionResult> DeleteUser(string id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteUserCommand(id), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    [HttpGet("roles")]
    public async Task<ActionResult<IList<string>>> GetRoles(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetRolesQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("roles")]
    public async Task<ActionResult> CreateRole([FromBody] CreateRoleCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? Created(string.Empty, null) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("roles/{name}")]
    public async Task<ActionResult> DeleteRole(string name, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteRoleCommand(name), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Bans ─────────────────────────────────────────────────────────────────

    [HttpGet("bans")]
    public async Task<ActionResult<List<UserBanDto>>> GetBans(
        [FromQuery] string? userId = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetUserBansQuery(userId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("bans")]
    public async Task<ActionResult<UserBanDto>> BanUser([FromBody] BanUserCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("bans/{id:int}/revoke")]
    public async Task<ActionResult> RevokeBan(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new RevokeUserBanCommand(id), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Reward Shop Management ─────────────────────────────────────────────────

    [HttpGet("rewards")]
    public async Task<ActionResult<List<AdminRewardItemDto>>> GetAdminRewards(
        [FromQuery] string? category = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetAdminRewardsQuery(category), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("rewards")]
    public async Task<ActionResult<AdminRewardItemDto>> CreateReward(
        [FromBody] CreateRewardItemCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? CreatedAtAction(nameof(GetAdminRewards), result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPut("rewards/{id:int}")]
    public async Task<ActionResult<AdminRewardItemDto>> UpdateReward(
        int id,
        [FromBody] UpdateRewardItemCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command with { Id = id }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("rewards/{id:int}")]
    public async Task<ActionResult> DeleteReward(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteRewardItemCommand(id), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }
}
