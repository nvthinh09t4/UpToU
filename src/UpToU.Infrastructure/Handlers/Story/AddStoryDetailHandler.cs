using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class AddStoryDetailHandler : IRequestHandler<AddStoryDetailCommand, Result<StoryDetailDto>>
{
    private readonly ApplicationDbContext _db;

    public AddStoryDetailHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<StoryDetailDto>> Handle(AddStoryDetailCommand request, CancellationToken ct)
    {
        var story = await _db.Stories
            .IgnoreQueryFilters()
            .Include(s => s.StoryDetails)
            .FirstOrDefaultAsync(s => s.Id == request.StoryId, ct);

        if (story is null)
            return Result<StoryDetailDto>.NotFound("Story not found.");

        var lastRevision = story.StoryDetails.Count > 0
            ? story.StoryDetails.Max(d => d.Revision)
            : 0;

        var previousWeight = story.StoryDetails
            .OrderByDescending(d => d.Revision)
            .FirstOrDefault()?.ScoreWeight;

        var history = previousWeight.HasValue && previousWeight.Value != request.ScoreWeight
            ? new List<decimal> { previousWeight.Value }
            : new List<decimal>();

        var detail = new StoryDetail
        {
            StoryId = request.StoryId,
            Revision = lastRevision + 1,
            IsPublish = request.IsPublish,
            SavePath = request.SavePath,
            Content = request.Content,
            WordCount = request.WordCount,
            ChangeNotes = request.ChangeNotes,
            ScoreWeight = request.ScoreWeight,
            ScoreWeightHistory = history,
            CreatedOn = DateTime.UtcNow,
        };

        _db.StoryDetails.Add(detail);
        await _db.SaveChangesAsync(ct);

        return Result<StoryDetailDto>.Success(StoryMapper.MapDetailToDto(detail));
    }
}
