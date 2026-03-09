using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class GetStoryDetailsHandler : IRequestHandler<GetStoryDetailsQuery, Result<List<StoryDetailDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetStoryDetailsHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<StoryDetailDto>>> Handle(GetStoryDetailsQuery request, CancellationToken ct)
    {
        var storyExists = await _db.Stories.IgnoreQueryFilters().AnyAsync(s => s.Id == request.StoryId, ct);
        if (!storyExists)
            return Result<List<StoryDetailDto>>.NotFound("Story not found.");

        var details = await _db.StoryDetails
            .AsNoTracking()
            .Where(d => d.StoryId == request.StoryId)
            .OrderByDescending(d => d.Revision)
            .ToListAsync(ct);

        return Result<List<StoryDetailDto>>.Success(details.Select(StoryMapper.MapDetailToDto).ToList());
    }
}
