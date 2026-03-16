using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Extensions;

namespace UpToU.Infrastructure.Handlers.Story;

public class RateStoryHandler : IRequestHandler<RateStoryCommand, Result<StoryRatingDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _http;
    private readonly ILogger<RateStoryHandler> _logger;

    public RateStoryHandler(ApplicationDbContext db, IHttpContextAccessor http, ILogger<RateStoryHandler> logger)
    {
        _db     = db;
        _http   = http;
        _logger = logger;
    }

    public async Task<Result<StoryRatingDto>> Handle(RateStoryCommand request, CancellationToken ct)
    {
        if (request.Rating < 1 || request.Rating > 5)
            return Result<StoryRatingDto>.Failure("Rating must be between 1 and 5.");

        var userId = _http.GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Result<StoryRatingDto>.Unauthorized("Authentication required.");

        var storyExists = await _db.Stories.AnyAsync(s => s.Id == request.StoryId && !s.IsDeleted, ct);
        if (!storyExists)
            return Result<StoryRatingDto>.NotFound("Story not found.");

        var existing = await _db.StoryRatings
            .FirstOrDefaultAsync(r => r.UserId == userId && r.StoryId == request.StoryId, ct);

        if (existing is null)
        {
            _db.StoryRatings.Add(new StoryRating
            {
                StoryId   = request.StoryId,
                UserId    = userId,
                Rating    = request.Rating,
                Comment   = request.Comment,
                CreatedAt = DateTime.UtcNow,
            });
        }
        else
        {
            existing.Rating    = request.Rating;
            existing.Comment   = request.Comment;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Story rated. {UserId} {StoryId} {Rating}", userId, request.StoryId, request.Rating);

        return Result<StoryRatingDto>.Success(await BuildRatingDtoAsync(_db, request.StoryId, userId, ct));
    }

    internal static async Task<StoryRatingDto> BuildRatingDtoAsync(
        ApplicationDbContext db, int storyId, string? userId, CancellationToken ct)
    {
        var ratings = await db.StoryRatings
            .AsNoTracking()
            .Where(r => r.StoryId == storyId)
            .ToListAsync(ct);

        var avg  = ratings.Count > 0 ? Math.Round(ratings.Average(r => r.Rating), 1) : 0.0;
        var mine = ratings.FirstOrDefault(r => r.UserId == userId);

        return new StoryRatingDto(storyId, avg, ratings.Count, mine?.Rating, mine?.Comment);
    }
}
