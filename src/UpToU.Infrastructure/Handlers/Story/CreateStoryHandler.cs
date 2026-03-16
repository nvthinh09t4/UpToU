using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Extensions;

namespace UpToU.Infrastructure.Handlers.Story;

public class CreateStoryHandler : IRequestHandler<CreateStoryCommand, Result<StoryDto>>
{
    private const int MaxSlugLength = 100;

    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _http;
    private readonly ILogger<CreateStoryHandler> _logger;

    public CreateStoryHandler(ApplicationDbContext db, IHttpContextAccessor http, ILogger<CreateStoryHandler> logger)
    {
        _db     = db;
        _http   = http;
        _logger = logger;
    }

    public async Task<Result<StoryDto>> Handle(CreateStoryCommand request, CancellationToken ct)
    {
        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct);
        if (!categoryExists)
        {
            _logger.LogWarning("Story creation failed — category not found. {CategoryId}", request.CategoryId);
            return Result<StoryDto>.NotFound("Category not found.");
        }

        var tags = request.TagIds.Count > 0
            ? await _db.Tags.Where(t => request.TagIds.Contains(t.Id)).ToListAsync(ct)
            : new List<Tag>();

        var authorId = _http.GetUserId();
        var slug     = await ResolveUniqueSlugAsync(request.Slug, request.Title, ct);

        var story = new Core.Entities.Story
        {
            AuthorId      = authorId,
            Status        = StoryStatus.Draft,
            Title         = request.Title,
            Slug          = slug,
            Description   = request.Description,
            Excerpt       = request.Excerpt,
            CoverImageUrl = request.CoverImageUrl,
            AuthorName    = request.AuthorName,
            IsFeatured    = request.IsFeatured,
            CategoryId    = request.CategoryId,
            PublishDate   = request.PublishDate,
            IsPublish     = request.IsPublish,
            CreatedOn     = DateTime.UtcNow,
            Tags          = tags,
            StoryDetails  = new List<StoryDetail>
            {
                new()
                {
                    Revision   = 1,
                    IsPublish  = true,
                    SavePath   = request.SavePath,
                    Content    = request.Content,
                    WordCount  = request.WordCount,
                    ScoreWeight = request.ScoreWeight,
                    CreatedOn  = DateTime.UtcNow,
                }
            }
        };

        _db.Stories.Add(story);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 }
                                           && ex.InnerException.Message.Contains("IX_Stories_Slug"))
        {
            story.Slug = $"{slug}-{Guid.NewGuid():N}"[..Math.Min(slug.Length + 33, MaxSlugLength)];
            _logger.LogWarning("Slug collision detected, retrying with suffix. {OriginalSlug} {NewSlug}", slug, story.Slug);
            await _db.SaveChangesAsync(ct);
        }

        await _db.Entry(story).Reference(s => s.Category).LoadAsync(ct);

        _logger.LogInformation(
            "Story created. {StoryId} {AuthorId} {CategoryId} {Slug} {Status}",
            story.Id, authorId, story.CategoryId, story.Slug, story.Status);

        return Result<StoryDto>.Success(StoryMapper.MapToDto(story));
    }

    private async Task<string> ResolveUniqueSlugAsync(string? requestedSlug, string title, CancellationToken ct)
    {
        var baseSlug = !string.IsNullOrWhiteSpace(requestedSlug) ? requestedSlug : GenerateSlug(title);
        var slug     = baseSlug;
        var counter  = 2;

        while (await _db.Stories.AnyAsync(s => s.Slug == slug, ct))
            slug = $"{baseSlug}-{counter++}";

        return slug;
    }

    private static string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-{2,}", "-");
        return slug.Trim('-').Length > 0 ? slug.Trim('-') : "story";
    }
}
