using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class DeleteStoryNodeHandler : IRequestHandler<DeleteStoryNodeCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;
    public DeleteStoryNodeHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<bool>> Handle(DeleteStoryNodeCommand request, CancellationToken ct)
    {
        // Null out any answers pointing to this node as NextNode
        await _db.StoryNodeAnswers
            .Where(a => a.NextNodeId == request.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.NextNodeId, (int?)null), ct);

        var deleted = await _db.StoryNodes
            .Where(n => n.Id == request.Id)
            .ExecuteDeleteAsync(ct);

        return deleted > 0 ? Result<bool>.Success(true) : Result<bool>.NotFound("Node not found.");
    }
}
