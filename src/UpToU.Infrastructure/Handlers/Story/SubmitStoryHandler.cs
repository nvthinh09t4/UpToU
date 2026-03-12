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

public class SubmitStoryHandler : IRequestHandler<SubmitStoryCommand, Result<StoryDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _http;

    public SubmitStoryHandler(ApplicationDbContext db, IHttpContextAccessor http)
    {
        _db = db;
        _http = http;
    }

    public async Task<Result<StoryDto>> Handle(SubmitStoryCommand request, CancellationToken ct)
    {
        var userId = _http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = _http.HttpContext?.User.IsInRole("Admin") ?? false;
        var isSupervisor = _http.HttpContext?.User.IsInRole("Supervisor") ?? false;

        var story = await _db.Stories
            .Include(s => s.Category)
            .Include(s => s.Tags)
            .Include(s => s.StoryDetails)
            .FirstOrDefaultAsync(s => s.Id == request.Id, ct);

        if (story is null)
            return Result<StoryDto>.NotFound("Story not found.");

        // Contributor can only submit their own stories; admins/supervisors can submit any
        if (!isAdmin && !isSupervisor && story.AuthorId != userId)
            return Result<StoryDto>.Failure("You can only submit your own stories.", 403);

        if (story.Status != StoryStatus.Draft && story.Status != StoryStatus.Rejected)
            return Result<StoryDto>.Conflict(
                $"Story cannot be submitted from its current status '{story.Status}'.");

        story.Status      = StoryStatus.Submitted;
        story.SubmittedAt = DateTime.UtcNow;
        story.ReviewedBy  = null;
        story.ReviewedAt  = null;
        story.RejectionReason = null;

        await _db.SaveChangesAsync(ct);

        return Result<StoryDto>.Success(StoryMapper.MapToDto(story));
    }
}
