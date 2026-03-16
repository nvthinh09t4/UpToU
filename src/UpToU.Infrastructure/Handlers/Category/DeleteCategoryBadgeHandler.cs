using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Category;

public class DeleteCategoryBadgeHandler : IRequestHandler<DeleteCategoryBadgeCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;
    public DeleteCategoryBadgeHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<bool>> Handle(DeleteCategoryBadgeCommand request, CancellationToken ct)
    {
        var badge = await _db.CategoryBadges.FirstOrDefaultAsync(b => b.Id == request.Id, ct);
        if (badge is null)
            return Result<bool>.NotFound("Badge not found.");

        _db.CategoryBadges.Remove(badge);
        await _db.SaveChangesAsync(ct);
        return Result<bool>.Success(true);
    }
}
