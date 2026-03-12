using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using NotificationEntity = UpToU.Core.Entities.Notification;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class RejectStoryHandler : IRequestHandler<RejectStoryCommand, Result<StoryDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _http;

    public RejectStoryHandler(ApplicationDbContext db, IHttpContextAccessor http)
    {
        _db = db;
        _http = http;
    }

    public async Task<Result<StoryDto>> Handle(RejectStoryCommand request, CancellationToken ct)
    {
        var supervisorId = _http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        var story = await _db.Stories
            .Include(s => s.Category)
            .Include(s => s.Tags)
            .Include(s => s.StoryDetails)
            .FirstOrDefaultAsync(s => s.Id == request.Id, ct);

        if (story is null)
            return Result<StoryDto>.NotFound("Story not found.");

        if (story.Status != StoryStatus.Submitted)
            return Result<StoryDto>.Conflict(
                $"Only submitted stories can be rejected. Current status: '{story.Status}'.");

        story.Status          = StoryStatus.Rejected;
        story.ReviewedBy      = supervisorId;
        story.ReviewedAt      = DateTime.UtcNow;
        story.RejectionReason = request.Reason;

        // Notify author if they exist
        if (story.AuthorId is not null)
        {
            _db.Notifications.Add(new NotificationEntity
            {
                RecipientId = story.AuthorId,
                Type        = "System",
                ActorName   = "Supervisor",
                Message     = $"Your story \"{story.Title}\" was rejected. Reason: {request.Reason}",
                IsRead      = false,
                CreatedAt   = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync(ct);

        return Result<StoryDto>.Success(StoryMapper.MapToDto(story));
    }
}
