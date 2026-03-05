using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.DTOs.Category;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Category;

public class GetCategoryByIdHandler : IRequestHandler<GetCategoryByIdQuery, Result<CategoryDto>>
{
    private readonly ApplicationDbContext _db;

    public GetCategoryByIdHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<CategoryDto>> Handle(GetCategoryByIdQuery request, CancellationToken ct)
    {
        var category = await _db.Categories
            .AsNoTracking()
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == request.Id, ct);

        if (category is null)
            return Result<CategoryDto>.NotFound("Category not found.");

        return Result<CategoryDto>.Success(GetCategoriesHandler.MapToDto(category, false));
    }
}
