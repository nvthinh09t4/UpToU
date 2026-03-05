using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.DTOs.Category;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;
using CategoryEntity = UpToU.Core.Entities.Category;

namespace UpToU.Infrastructure.Handlers.Category;

public class CreateCategoryHandler : IRequestHandler<CreateCategoryCommand, Result<CategoryDto>>
{
    private readonly ApplicationDbContext _db;

    public CreateCategoryHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken ct)
    {
        if (request.ParentId.HasValue)
        {
            var parentExists = await _db.Categories.AnyAsync(c => c.Id == request.ParentId.Value, ct);
            if (!parentExists)
                return Result<CategoryDto>.NotFound("Parent category not found.");
        }

        var category = new CategoryEntity
        {
            Title = request.Title,
            Description = request.Description,
            IsActive = request.IsActive,
            ScoreWeight = request.ScoreWeight,
            OrderToShow = request.OrderToShow,
            ParentId = request.ParentId,
            CreatedOn = DateTime.UtcNow,
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync(ct);

        return Result<CategoryDto>.Success(GetCategoriesHandler.MapToDto(category, false));
    }
}
