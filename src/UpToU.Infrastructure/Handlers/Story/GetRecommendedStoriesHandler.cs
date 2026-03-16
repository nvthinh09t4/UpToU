using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Extensions;
using StoryEntity = UpToU.Core.Entities.Story;

namespace UpToU.Infrastructure.Handlers.Story;

public class GetRecommendedStoriesHandler : IRequestHandler<GetRecommendedStoriesQuery, Result<List<RecommendedStoryDto>>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _http;

    public GetRecommendedStoriesHandler(ApplicationDbContext db, IHttpContextAccessor http)
    {
        _db   = db;
        _http = http;
    }

    public async Task<Result<List<RecommendedStoryDto>>> Handle(GetRecommendedStoriesQuery request, CancellationToken ct)
    {
        var userId = _http.GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Result<List<RecommendedStoryDto>>.Unauthorized("Authentication required.");

        // Stories the user has already started or completed
        var seenStoryIds = await _db.UserStoryProgresses
            .Where(p => p.UserId == userId)
            .Select(p => p.StoryId)
            .ToListAsync(ct);

        // Top categories by credit earnings (proxy for interest)
        var topCategoryIds = await _db.CreditTransactions
            .Where(t => t.UserId == userId && t.CategoryId != null && t.Type == CreditTransactionTypes.StoryComplete)
            .GroupBy(t => t.CategoryId!.Value)
            .OrderByDescending(g => g.Sum(t => t.Amount))
            .Select(g => g.Key)
            .Take(3)
            .ToListAsync(ct);

        // Base query: published, not deleted, not seen
        var baseQuery = _db.Stories
            .AsNoTracking()
            .Where(s => s.IsPublish && !s.IsDeleted && !seenStoryIds.Contains(s.Id))
            .Include(s => s.Category);

        List<StoryEntity> candidates;

        if (topCategoryIds.Count >= 1)
        {
            // Prefer top categories, then fill with any published story
            candidates = await baseQuery
                .OrderByDescending(s => topCategoryIds.Contains(s.CategoryId) ? 1 : 0)
                .ThenByDescending(s => s.IsFeatured)
                .ThenByDescending(s => s.ViewCount)
                .Take(request.Count)
                .ToListAsync(ct);
        }
        else
        {
            // No history: return featured stories
            candidates = await baseQuery
                .OrderByDescending(s => s.IsFeatured)
                .ThenByDescending(s => s.ViewCount)
                .Take(request.Count)
                .ToListAsync(ct);
        }

        // Get aggregate ratings for candidates
        var storyIds = candidates.Select(s => s.Id).ToList();
        var ratingMap = await _db.StoryRatings
            .AsNoTracking()
            .Where(r => storyIds.Contains(r.StoryId))
            .GroupBy(r => r.StoryId)
            .Select(g => new { StoryId = g.Key, Avg = g.Average(r => (double)r.Rating), Count = g.Count() })
            .ToDictionaryAsync(x => x.StoryId, x => (x.Avg, x.Count), ct);

        var result = candidates.Select(s =>
        {
            var hasRating     = ratingMap.TryGetValue(s.Id, out var rating);
            var categoryMatch = topCategoryIds.Contains(s.CategoryId);
            var reason        = categoryMatch ? s.Category?.Title ?? "Recommended" : "Popular";

            return new RecommendedStoryDto(
                s.Id, s.Title, s.Slug, s.Excerpt, s.CoverImageUrl,
                s.StoryType, s.CategoryId, s.Category?.Title ?? "",
                hasRating ? Math.Round(rating.Avg, 1) : 0.0,
                hasRating ? rating.Count : 0,
                s.ViewCount, reason);
        }).ToList();

        return Result<List<RecommendedStoryDto>>.Success(result);
    }
}
