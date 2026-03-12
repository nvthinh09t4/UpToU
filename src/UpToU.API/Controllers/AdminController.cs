using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UpToU.Core.Commands.Admin;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.DTOs.Credit;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator) => _mediator = mediator;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    [HttpGet("dashboard")]
    [Authorize(Policy = "StaffOrAdmin")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboard(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetDashboardStatsQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    [HttpGet("users")]
    [Authorize(Policy = "SeniorSupervisorOrAdmin")]
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
    [Authorize(Policy = "SeniorSupervisorOrAdmin")]
    public async Task<ActionResult<AdminUserDto>> GetUser(string id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetUserByIdQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPut("users/{id}")]
    [Authorize(Policy = "SeniorSupervisorOrAdmin")]
    public async Task<ActionResult<AdminUserDto>> UpdateUser(
        string id,
        [FromBody] UpdateUserCommand command,
        CancellationToken ct)
    {
        // Senior Supervisors can only assign Supervisor and Contributor roles — not Admin or Senior Supervisor
        var callerRoles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        if (!callerRoles.Contains("Admin"))
        {
            var privilegedRoles = new[] { "Admin", "Senior Supervisor" };
            var forbidden = command.Roles.Intersect(privilegedRoles).ToList();
            if (forbidden.Count > 0)
                return Problem(
                    $"Senior Supervisors cannot assign the following roles: {string.Join(", ", forbidden)}.",
                    statusCode: StatusCodes.Status403Forbidden);
        }

        var result = await _mediator.Send(command with { UserId = id }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("users/{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> DeleteUser(string id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteUserCommand(id), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    [HttpGet("roles")]
    [Authorize(Policy = "SeniorSupervisorOrAdmin")]
    public async Task<ActionResult<IList<string>>> GetRoles(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetRolesQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("roles")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> CreateRole([FromBody] CreateRoleCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? Created(string.Empty, null) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("roles/{name}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> DeleteRole(string name, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteRoleCommand(name), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Bans ─────────────────────────────────────────────────────────────────

    [HttpGet("bans")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<List<UserBanDto>>> GetBans(
        [FromQuery] string? userId = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetUserBansQuery(userId), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("bans")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<UserBanDto>> BanUser([FromBody] BanUserCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("bans/{id:int}/revoke")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> RevokeBan(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new RevokeUserBanCommand(id), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    // ── Reward Shop Management ─────────────────────────────────────────────────

    [HttpGet("rewards")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<List<AdminRewardItemDto>>> GetAdminRewards(
        [FromQuery] string? category = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetAdminRewardsQuery(category), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("rewards")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<AdminRewardItemDto>> CreateReward(
        [FromBody] CreateRewardItemCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? CreatedAtAction(nameof(GetAdminRewards), result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPut("rewards/{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<AdminRewardItemDto>> UpdateReward(
        int id,
        [FromBody] UpdateRewardItemCommand command,
        CancellationToken ct)
    {
        var result = await _mediator.Send(command with { Id = id }, ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("rewards/{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> DeleteReward(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteRewardItemCommand(id), ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }
}
