using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class DeleteStoryNodeAnswerHandler : IRequestHandler<DeleteStoryNodeAnswerCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;
    public DeleteStoryNodeAnswerHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<bool>> Handle(DeleteStoryNodeAnswerCommand request, CancellationToken ct)
    {
        var answer = await _db.StoryNodeAnswers
            .Where(a => a.Id == request.Id)
            .Select(a => new { a.Id, a.StoryNodeId })
            .FirstOrDefaultAsync(ct);
        if (answer is null) return Result<bool>.NotFound("Answer not found.");

        // Ensure at least 2 answers remain after deletion
        var remaining = await _db.StoryNodeAnswers.CountAsync(a => a.StoryNodeId == answer.StoryNodeId, ct);
        if (remaining <= 2)
            return Result<bool>.Failure("A node must have at least 2 answers.");

        await _db.StoryNodeAnswers.Where(a => a.Id == request.Id).ExecuteDeleteAsync(ct);
        return Result<bool>.Success(true);
    }
}
