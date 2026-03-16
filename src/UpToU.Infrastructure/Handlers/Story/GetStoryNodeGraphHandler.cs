using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class GetStoryNodeGraphHandler : IRequestHandler<GetStoryNodeGraphQuery, Result<StoryNodeGraphDto>>
{
    private readonly ApplicationDbContext _db;
    public GetStoryNodeGraphHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<StoryNodeGraphDto>> Handle(GetStoryNodeGraphQuery request, CancellationToken ct)
    {
        var detail = await _db.StoryDetails.AsNoTracking()
            .Where(d => d.Id == request.StoryDetailId)
            .Select(d => new { d.Id, d.Revision, d.EffectiveDate })
            .FirstOrDefaultAsync(ct);

        if (detail is null) return Result<StoryNodeGraphDto>.NotFound("Story detail not found.");

        var nodes = await _db.StoryNodes.AsNoTracking()
            .Where(n => n.StoryDetailId == request.StoryDetailId)
            .OrderBy(n => n.SortOrder).ThenBy(n => n.Id)
            .Select(n => new StoryNodeDto(
                n.Id, n.StoryDetailId,
                n.Question, n.QuestionSubtitle, n.QuestionVi, n.QuestionSubtitleVi,
                n.IsStart, n.BackgroundImageUrl, n.BackgroundColor, n.VideoUrl, n.AnimationType, n.SortOrder,
                n.Answers.OrderBy(a => a.SortOrder).ThenBy(a => a.Id)
                    .Select(a => new StoryNodeAnswerDto(
                        a.Id, a.Text, a.TextVi, a.PointsAwarded, a.ScoreDeltas,
                        a.NextNodeId, a.BranchWeights, a.Feedback, a.FeedbackVi,
                        a.Color, a.SortOrder))
                    .ToList()))
            .ToListAsync(ct);

        return Result<StoryNodeGraphDto>.Success(new StoryNodeGraphDto(detail.Id, detail.Revision, detail.EffectiveDate, nodes));
    }
}
