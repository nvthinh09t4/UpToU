using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class GetAdminStoriesHandler : IRequestHandler<GetAdminStoriesQuery, Result<List<StoryDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetAdminStoriesHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<StoryDto>>> Handle(GetAdminStoriesQuery request, CancellationToken ct)
    {
        var query = _db.Stories
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(s => s.Category)
            .Include(s => s.Tags)
            .Include(s => s.StoryDetails)
            .AsQueryable();

        if (request.CategoryId.HasValue)
            query = query.Where(s => s.CategoryId == request.CategoryId.Value);

        var stories = await query
            .OrderByDescending(s => s.CreatedOn)
            .ToListAsync(ct);

        return Result<List<StoryDto>>.Success(stories.Select(s => StoryMapper.MapToDto(s)).ToList());
    }
}
