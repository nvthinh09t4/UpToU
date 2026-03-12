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

public class CreateStoryHandler : IRequestHandler<CreateStoryCommand, Result<StoryDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _http;

    public CreateStoryHandler(ApplicationDbContext db, IHttpContextAccessor http)
    {
        _db = db;
        _http = http;
    }

    public async Task<Result<StoryDto>> Handle(CreateStoryCommand request, CancellationToken ct)
    {
        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct);
        if (!categoryExists)
            return Result<StoryDto>.NotFound("Category not found.");

        var tags = request.TagIds.Count > 0
            ? await _db.Tags.Where(t => request.TagIds.Contains(t.Id)).ToListAsync(ct)
            : new List<Tag>();

        var authorId = _http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        var story = new Core.Entities.Story
        {
            AuthorId = authorId,
            Status   = StoryStatus.Draft,
            Title = request.Title,
            Slug = request.Slug,
            Description = request.Description,
            Excerpt = request.Excerpt,
            CoverImageUrl = request.CoverImageUrl,
            AuthorName = request.AuthorName,
            IsFeatured = request.IsFeatured,
            CategoryId = request.CategoryId,
            PublishDate = request.PublishDate,
            IsPublish = request.IsPublish,
            CreatedOn = DateTime.UtcNow,
            Tags = tags,
            StoryDetails = new List<StoryDetail>
            {
                new()
                {
                    Revision = 1,
                    IsPublish = true,
                    SavePath = request.SavePath,
                    Content = request.Content,
                    WordCount = request.WordCount,
                    ScoreWeight = request.ScoreWeight,
                    CreatedOn = DateTime.UtcNow,
                }
            }
        };

        _db.Stories.Add(story);
        await _db.SaveChangesAsync(ct);

        await _db.Entry(story).Reference(s => s.Category).LoadAsync(ct);

        return Result<StoryDto>.Success(StoryMapper.MapToDto(story));
    }
}
