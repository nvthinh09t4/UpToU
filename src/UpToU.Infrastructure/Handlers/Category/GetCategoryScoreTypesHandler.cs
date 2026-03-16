using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Category;

public class GetCategoryScoreTypesHandler : IRequestHandler<GetCategoryScoreTypesQuery, Result<List<CategoryScoreTypeDto>>>
{
    private readonly ApplicationDbContext _db;
    public GetCategoryScoreTypesHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<CategoryScoreTypeDto>>> Handle(GetCategoryScoreTypesQuery request, CancellationToken ct)
    {
        var types = await _db.CategoryScoreTypes.AsNoTracking()
            .Where(st => st.CategoryId == request.CategoryId)
            .OrderBy(st => st.OrderToShow)
            .Select(st => new CategoryScoreTypeDto(st.Id, st.Name, st.Label, st.ScoreWeight, st.OrderToShow))
            .ToListAsync(ct);

        return Result<List<CategoryScoreTypeDto>>.Success(types);
    }
}
