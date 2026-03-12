using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class ApproveStoryHandler : IRequestHandler<ApproveStoryCommand, Result<StoryDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _http;

    public ApproveStoryHandler(ApplicationDbContext db, IHttpContextAccessor http)
    {
        _db = db;
        _http = http;
    }

    public async Task<Result<StoryDto>> Handle(ApproveStoryCommand request, CancellationToken ct)
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
                $"Only submitted stories can be approved. Current status: '{story.Status}'.");

        story.ReviewedBy  = supervisorId;
        story.ReviewedAt  = DateTime.UtcNow;
        story.RejectionReason = null;

        var publishDate = request.PublishDate;
        var isImmediate = publishDate is null || publishDate <= DateTime.UtcNow;

        if (isImmediate)
        {
            story.Status    = StoryStatus.Published;
            story.IsPublish = true;
            story.PublishDate = DateTime.UtcNow;
        }
        else
        {
            // Scheduled: set the target date; background job will flip IsPublish
            story.Status      = StoryStatus.Approved;
            story.IsPublish   = false;
            story.PublishDate = publishDate;
        }

        await _db.SaveChangesAsync(ct);

        return Result<StoryDto>.Success(StoryMapper.MapToDto(story));
    }
}
