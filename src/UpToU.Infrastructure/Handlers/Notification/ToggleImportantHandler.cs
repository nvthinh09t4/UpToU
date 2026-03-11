using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Notification;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Notification;

public class ToggleImportantHandler : IRequestHandler<ToggleImportantCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ToggleImportantHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<bool>> Handle(ToggleImportantCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<bool>.Unauthorized("Authentication required.");

        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId && n.RecipientId == userId, ct);

        if (notification is null)
            return Result<bool>.NotFound("Notification not found.");

        notification.IsImportant = !notification.IsImportant;

        // If marked important, move out of archive
        if (notification.IsImportant)
        {
            notification.IsArchived = false;
            notification.ArchivedAt = null;
        }

        await _db.SaveChangesAsync(ct);
        return Result<bool>.Success(notification.IsImportant);
    }
}
