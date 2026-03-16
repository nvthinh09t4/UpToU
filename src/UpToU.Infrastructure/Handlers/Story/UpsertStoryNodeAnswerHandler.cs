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

        const int MaxAnswersPerNode = 5;
        if (!request.Id.HasValue)
        {
            var count = await _db.StoryNodeAnswers.CountAsync(a => a.StoryNodeId == request.StoryNodeId, ct);
            if (count >= MaxAnswersPerNode)
                return Result<StoryNodeAnswerDto>.Failure($"A node cannot have more than {MaxAnswersPerNode} answers.");
        }

        // Validate BranchWeights — if provided, all keys must be valid node IDs in the same StoryDetail
        if (request.BranchWeights.Count > 0)
        {
            if (request.BranchWeights.Values.Any(w => w <= 0))
                return Result<StoryNodeAnswerDto>.Failure("All branch weights must be positive integers.");

            foreach (var key in request.BranchWeights.Keys)
            {
                if (!int.TryParse(key, out _))
                    return Result<StoryNodeAnswerDto>.Failure($"BranchWeights key '{key}' is not a valid node ID.");
            }

            var targetIds = request.BranchWeights.Keys.Select(int.Parse).ToList();
            var validCount = await _db.StoryNodes.CountAsync(
                n => targetIds.Contains(n.Id) && n.StoryDetailId == node.StoryDetailId, ct);
            if (validCount != targetIds.Distinct().Count())
                return Result<StoryNodeAnswerDto>.Failure("All BranchWeights node IDs must belong to the same story revision.");
        }
        else if (request.NextNodeId.HasValue)
        {
            // Validate deterministic NextNodeId
            var nextExists = await _db.StoryNodes.AnyAsync(
                n => n.Id == request.NextNodeId.Value && n.StoryDetailId == node.StoryDetailId, ct);
            if (!nextExists)
                return Result<StoryNodeAnswerDto>.Failure("NextNodeId must reference a node in the same story revision.");
        }

        StoryNodeAnswer answer;
        if (request.Id.HasValue)
        {
            answer = await _db.StoryNodeAnswers.FirstOrDefaultAsync(a => a.Id == request.Id.Value, ct);
            if (answer is null) return Result<StoryNodeAnswerDto>.NotFound($"Answer {request.Id} not found.");
        }
        else
        {
            answer = new StoryNodeAnswer { StoryNodeId = request.StoryNodeId };
            _db.StoryNodeAnswers.Add(answer);
        }

        answer.Text          = request.Text;
        answer.TextVi        = request.TextVi;
        answer.PointsAwarded = request.PointsAwarded;
        answer.ScoreDeltas   = request.ScoreDeltas;
        answer.NextNodeId    = request.BranchWeights.Count > 0 ? null : request.NextNodeId;
        answer.BranchWeights = request.BranchWeights;
        answer.Feedback      = request.Feedback;
        answer.FeedbackVi    = request.FeedbackVi;
        answer.Color         = request.Color;
        answer.SortOrder     = request.SortOrder;

        await _db.SaveChangesAsync(ct);

        return Result<StoryNodeAnswerDto>.Success(new StoryNodeAnswerDto(
            answer.Id, answer.Text, answer.TextVi, answer.PointsAwarded, answer.ScoreDeltas,
            answer.NextNodeId, answer.BranchWeights, answer.Feedback, answer.FeedbackVi,
            answer.Color, answer.SortOrder));
    }
}
