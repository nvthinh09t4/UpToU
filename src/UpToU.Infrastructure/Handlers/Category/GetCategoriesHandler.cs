using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.DTOs.Category;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Category;

public class GetCategoriesHandler : IRequestHandler<GetCategoriesQuery, Result<List<CategoryDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetCategoriesHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken ct)
    {
        var query = _db.Categories
            .AsNoTracking()
            .Include(c => c.Children)
            .Where(c => c.ParentId == null);

        if (request.ActiveOnly)
            query = query.Where(c => c.IsActive);

        var categories = await query
            .OrderBy(c => c.OrderToShow)
            .ThenBy(c => c.Title)
            .ToListAsync(ct);

        var dtos = categories.Select(c => MapToDto(c, request.ActiveOnly)).ToList();
        return Result<List<CategoryDto>>.Success(dtos);
    }

    internal static CategoryDto MapToDto(Core.Entities.Category c, bool activeOnly)
    {
        var children = c.Children
            .Where(ch => !activeOnly || ch.IsActive)
            .OrderBy(ch => ch.OrderToShow)
            .ThenBy(ch => ch.Title)
            .Select(ch => MapToDto(ch, activeOnly))
            .ToList();

        return new CategoryDto(
            c.Id, c.Title, c.Description, c.IsActive,
            c.ScoreWeight, c.ScoreWeightHistory, c.OrderToShow,
            c.ParentId, c.CreatedOn, c.ModifiedOn,
            c.CreatedBy, c.ModifiedBy, children);
    }
}
