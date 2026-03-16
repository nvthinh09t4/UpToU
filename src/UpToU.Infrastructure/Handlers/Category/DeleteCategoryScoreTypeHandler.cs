using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Category;

public class DeleteCategoryScoreTypeHandler : IRequestHandler<DeleteCategoryScoreTypeCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;
    public DeleteCategoryScoreTypeHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<bool>> Handle(DeleteCategoryScoreTypeCommand request, CancellationToken ct)
    {
        var scoreType = await _db.CategoryScoreTypes.FirstOrDefaultAsync(st => st.Id == request.Id, ct);
        if (scoreType is null)
            return Result<bool>.NotFound("Score type not found.");

        // Block deletion if any story uses this as its max-score gate
        var inUse = await _db.Stories.AnyAsync(s => s.MaxScoreTypeId == request.Id, ct);
        if (inUse)
            return Result<bool>.Failure(
                "Cannot delete this score type because one or more stories reference it as their completion gate. " +
                "Update or remove those stories first.");

        _db.CategoryScoreTypes.Remove(scoreType);
        await _db.SaveChangesAsync(ct);
        return Result<bool>.Success(true);
    }
}
