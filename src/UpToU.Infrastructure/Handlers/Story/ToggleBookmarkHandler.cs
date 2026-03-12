using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class ToggleBookmarkHandler : IRequestHandler<ToggleBookmarkCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ToggleBookmarkHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<bool>> Handle(ToggleBookmarkCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<bool>.Unauthorized("Authentication required.");

        if (!await _db.Stories.AnyAsync(s => s.Id == request.StoryId, ct))
            return Result<bool>.NotFound("Story not found.");

        var existing = await _db.Bookmarks
            .FirstOrDefaultAsync(b => b.StoryId == request.StoryId && b.UserId == userId, ct);

        if (existing is null)
        {
            _db.Bookmarks.Add(new Bookmark
            {
                StoryId = request.StoryId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync(ct);
            return Result<bool>.Success(true);
        }

        _db.Bookmarks.Remove(existing);
        await _db.SaveChangesAsync(ct);
        return Result<bool>.Success(false);
    }
}
