using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Notification;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Notification;

public class DeleteArchivedNotificationsHandler
    : IRequestHandler<DeleteArchivedNotificationsCommand, Result<int>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DeleteArchivedNotificationsHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<int>> Handle(DeleteArchivedNotificationsCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var cutoff = DateTime.UtcNow.AddDays(-5);

        // Delete archived (non-important) notifications older than 5 days
        // If called by an authenticated user, scope to their notifications
        // Otherwise (cleanup job), delete all expired archived
        var query = _db.Notifications
            .Where(n => n.IsArchived && !n.IsImportant && n.ArchivedAt != null && n.ArchivedAt <= cutoff);

        if (userId is not null)
            query = query.Where(n => n.RecipientId == userId);

        var deleted = await query.ExecuteDeleteAsync(ct);
        return Result<int>.Success(deleted);
    }
}
