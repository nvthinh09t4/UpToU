using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class DeleteStoryHandler : IRequestHandler<DeleteStoryCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;

    public DeleteStoryHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<bool>> Handle(DeleteStoryCommand request, CancellationToken ct)
    {
        var story = await _db.Stories
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Id == request.Id, ct);

        if (story is null)
            return Result<bool>.NotFound("Story not found.");

        story.IsDeleted = true;
        story.ModifiedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }
}
