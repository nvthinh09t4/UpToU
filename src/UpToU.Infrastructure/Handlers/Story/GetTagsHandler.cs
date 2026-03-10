using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class GetTagsHandler : IRequestHandler<GetTagsQuery, Result<List<TagDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetTagsHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<TagDto>>> Handle(GetTagsQuery request, CancellationToken ct)
    {
        var tags = await _db.Tags
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .Select(t => new TagDto(t.Id, t.Name))
            .ToListAsync(ct);

        return Result<List<TagDto>>.Success(tags);
    }
}
