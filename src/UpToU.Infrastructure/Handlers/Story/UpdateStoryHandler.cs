using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class UpdateStoryHandler : IRequestHandler<UpdateStoryCommand, Result<StoryDto>>
{
    private readonly ApplicationDbContext _db;

    public UpdateStoryHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<StoryDto>> Handle(UpdateStoryCommand request, CancellationToken ct)
    {
        var story = await _db.Stories
            .Include(s => s.Category)
            .Include(s => s.Tags)
            .Include(s => s.StoryDetails)
            .FirstOrDefaultAsync(s => s.Id == request.Id, ct);

        if (story is null)
            return Result<StoryDto>.NotFound("Story not found.");

        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct);
        if (!categoryExists)
            return Result<StoryDto>.NotFound("Category not found.");

        var tags = request.TagIds.Count > 0
            ? await _db.Tags.Where(t => request.TagIds.Contains(t.Id)).ToListAsync(ct)
            : new List<Tag>();

        story.Title = request.Title;
        story.Slug = request.Slug;
        story.Description = request.Description;
        story.Excerpt = request.Excerpt;
        story.CoverImageUrl = request.CoverImageUrl;
        story.AuthorName = request.AuthorName;
        story.IsFeatured = request.IsFeatured;
        story.CategoryId = request.CategoryId;
        story.PublishDate = request.PublishDate;
        story.IsPublish = request.IsPublish;
        story.ModifiedOn = DateTime.UtcNow;
        story.Tags = tags;

        await _db.SaveChangesAsync(ct);

        return Result<StoryDto>.Success(StoryMapper.MapToDto(story));
    }
}
