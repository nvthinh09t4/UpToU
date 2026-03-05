using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.DTOs.Category;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Category;

public class UpdateCategoryHandler : IRequestHandler<UpdateCategoryCommand, Result<CategoryDto>>
{
    private readonly ApplicationDbContext _db;

    public UpdateCategoryHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken ct)
    {
        var category = await _db.Categories
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == request.Id, ct);

        if (category is null)
            return Result<CategoryDto>.NotFound("Category not found.");

        if (request.ParentId.HasValue)
        {
            if (request.ParentId.Value == request.Id)
                return Result<CategoryDto>.Failure("A category cannot be its own parent.");

            var parentExists = await _db.Categories.AnyAsync(c => c.Id == request.ParentId.Value, ct);
            if (!parentExists)
                return Result<CategoryDto>.NotFound("Parent category not found.");
        }

        if (category.ScoreWeight != request.ScoreWeight)
            category.ScoreWeightHistory.Add(category.ScoreWeight);

        category.Title = request.Title;
        category.Description = request.Description;
        category.IsActive = request.IsActive;
        category.ScoreWeight = request.ScoreWeight;
        category.OrderToShow = request.OrderToShow;
        category.ParentId = request.ParentId;
        category.ModifiedOn = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Result<CategoryDto>.Success(GetCategoriesHandler.MapToDto(category, false));
    }
}
