using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class DeleteTagHandler : IRequestHandler<DeleteTagCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;

    public DeleteTagHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<bool>> Handle(DeleteTagCommand request, CancellationToken ct)
    {
        var tag = await _db.Tags.FirstOrDefaultAsync(t => t.Id == request.Id, ct);
        if (tag is null)
            return Result<bool>.NotFound("Tag not found.");

        _db.Tags.Remove(tag);
        await _db.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }
}
