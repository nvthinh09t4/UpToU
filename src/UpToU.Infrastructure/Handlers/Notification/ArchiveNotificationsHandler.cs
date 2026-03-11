using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Notification;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Notification;

public class ArchiveNotificationsHandler : IRequestHandler<ArchiveNotificationsCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ArchiveNotificationsHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<bool>> Handle(ArchiveNotificationsCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<bool>.Unauthorized("Authentication required.");

        await _db.Notifications
            .Where(n => request.NotificationIds.Contains(n.Id)
                        && n.RecipientId == userId
                        && n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsArchived, true)
                .SetProperty(n => n.ArchivedAt, DateTime.UtcNow), ct);

        return Result<bool>.Success(true);
    }
}
