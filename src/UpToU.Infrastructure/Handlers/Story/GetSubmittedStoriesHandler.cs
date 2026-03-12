using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class GetSubmittedStoriesHandler : IRequestHandler<GetSubmittedStoriesQuery, Result<List<StoryDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetSubmittedStoriesHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<StoryDto>>> Handle(GetSubmittedStoriesQuery request, CancellationToken ct)
    {
        var stories = await _db.Stories
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Include(s => s.Category)
            .Include(s => s.Tags)
            .Include(s => s.StoryDetails)
            .Where(s => s.Status == StoryStatus.Submitted && !s.IsDeleted)
            .OrderBy(s => s.SubmittedAt)
            .ToListAsync(ct);

        return Result<List<StoryDto>>.Success(
            stories.Select(s => StoryMapper.MapToDto(s)).ToList());
    }
}
