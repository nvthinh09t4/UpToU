using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class UpsertStoryNodeAnswerHandler : IRequestHandler<UpsertStoryNodeAnswerCommand, Result<StoryNodeAnswerDto>>
{
    private readonly ApplicationDbContext _db;
    public UpsertStoryNodeAnswerHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<StoryNodeAnswerDto>> Handle(UpsertStoryNodeAnswerCommand request, CancellationToken ct)
    {
        var node = await _db.StoryNodes
            .Where(n => n.Id == request.StoryNodeId)
            .Select(n => new { n.Id, n.StoryDetailId })
            .FirstOrDefaultAsync(ct);
        if (node is null) return Result<StoryNodeAnswerDto>.NotFound("Node not found.");

        // Validate answer count (max 5 per node)
        if (!request.Id.HasValue)
        {
            var count = await _db.StoryNodeAnswers.CountAsync(a => a.StoryNodeId == request.StoryNodeId, ct);
            if (count >= 5)
                return Result<StoryNodeAnswerDto>.Failure("A node cannot have more than 5 answers.");
        }

        // Validate NextNodeId belongs to the same StoryDetail
        if (request.NextNodeId.HasValue)
        {
            var nextExists = await _db.StoryNodes.AnyAsync(
                n => n.Id == request.NextNodeId.Value && n.StoryDetailId == node.StoryDetailId, ct);
            if (!nextExists)
                return Result<StoryNodeAnswerDto>.Failure("NextNodeId must reference a node in the same story revision.");
        }

        StoryNodeAnswer answer;
        if (request.Id.HasValue)
        {
            answer = await _db.StoryNodeAnswers.FirstOrDefaultAsync(a => a.Id == request.Id.Value, ct)
                ?? throw new KeyNotFoundException($"Answer {request.Id} not found.");
        }
        else
        {
            answer = new StoryNodeAnswer { StoryNodeId = request.StoryNodeId };
            _db.StoryNodeAnswers.Add(answer);
        }

        answer.Text          = request.Text;
        answer.PointsAwarded = request.PointsAwarded;
        answer.NextNodeId    = request.NextNodeId;
        answer.Color         = request.Color;
        answer.SortOrder     = request.SortOrder;

        await _db.SaveChangesAsync(ct);

        return Result<StoryNodeAnswerDto>.Success(new StoryNodeAnswerDto(
            answer.Id, answer.Text, answer.PointsAwarded, answer.NextNodeId, answer.Color, answer.SortOrder));
    }
}
