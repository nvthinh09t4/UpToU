using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Notification;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.DTOs.Notification;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Notification;

public class GetNotificationsHandler : IRequestHandler<GetNotificationsQuery, Result<PagedResult<NotificationDto>>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public GetNotificationsHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<PagedResult<NotificationDto>>> Handle(GetNotificationsQuery request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<PagedResult<NotificationDto>>.Unauthorized("Authentication required.");

        var query = _db.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(n => new NotificationDto(n.Id, n.Type, n.StoryId, n.CommentId, n.ActorName,
                n.Message, n.IsRead, n.IsArchived, n.IsImportant, n.CreatedAt))
            .ToListAsync(ct);

        return Result<PagedResult<NotificationDto>>.Success(
            new PagedResult<NotificationDto>(items, totalCount, request.Page, request.PageSize));
    }
}
