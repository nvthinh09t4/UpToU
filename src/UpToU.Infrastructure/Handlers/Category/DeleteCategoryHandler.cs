using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Category;

public class DeleteCategoryHandler : IRequestHandler<DeleteCategoryCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;

    public DeleteCategoryHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<bool>> Handle(DeleteCategoryCommand request, CancellationToken ct)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id, ct);

        if (category is null)
            return Result<bool>.NotFound("Category not found.");

        category.IsDeleted = true;
        category.ModifiedOn = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }
}
