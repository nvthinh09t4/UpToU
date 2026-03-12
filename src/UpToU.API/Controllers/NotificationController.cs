using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Notification;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.DTOs.Notification;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<PagedResult<NotificationDto>>> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetNotificationsQuery(page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetUnreadCountQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("mark-read")]
    public async Task<ActionResult> MarkRead([FromBody] MarkNotificationsReadCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpGet("folder/{folder}")]
    public async Task<ActionResult<PagedResult<NotificationDto>>> GetByFolder(
        string folder,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetNotificationsByFolderQuery(folder, page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("archive")]
    public async Task<ActionResult> Archive([FromBody] ArchiveNotificationsCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? NoContent() : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpPost("{id:int}/toggle-important")]
    public async Task<ActionResult<bool>> ToggleImportant(int id, CancellationToken ct)
    {
        var result = await _mediator.Send(new ToggleImportantCommand(id), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }

    [HttpDelete("archived")]
    public async Task<ActionResult<int>> CleanupArchived(CancellationToken ct)
    {
        var result = await _mediator.Send(new DeleteArchivedNotificationsCommand(), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }
}
