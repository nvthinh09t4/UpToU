using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class UpsertStoryNodeHandler : IRequestHandler<UpsertStoryNodeCommand, Result<StoryNodeDto>>
{
    private readonly ApplicationDbContext _db;
    public UpsertStoryNodeHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<StoryNodeDto>> Handle(UpsertStoryNodeCommand request, CancellationToken ct)
    {
        var detailExists = await _db.StoryDetails.AnyAsync(d => d.Id == request.StoryDetailId, ct);
        if (!detailExists) return Result<StoryNodeDto>.NotFound("Story detail not found.");

        // Ensure only one start node per detail
        if (request.IsStart)
        {
            await _db.StoryNodes
                .Where(n => n.StoryDetailId == request.StoryDetailId && n.IsStart && n.Id != (request.Id ?? 0))
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsStart, false), ct);
        }

        StoryNode node;
        if (request.Id.HasValue)
        {
            node = await _db.StoryNodes.FirstOrDefaultAsync(n => n.Id == request.Id.Value, ct)
                ?? throw new KeyNotFoundException($"Node {request.Id} not found.");
        }
        else
        {
            node = new StoryNode { StoryDetailId = request.StoryDetailId };
            _db.StoryNodes.Add(node);
        }

        node.Question           = request.Question;
        node.QuestionSubtitle   = request.QuestionSubtitle;
        node.IsStart            = request.IsStart;
        node.BackgroundImageUrl = request.BackgroundImageUrl;
        node.BackgroundColor    = request.BackgroundColor;
        node.VideoUrl           = request.VideoUrl;
        node.AnimationType      = request.AnimationType;
        node.SortOrder          = request.SortOrder;

        await _db.SaveChangesAsync(ct);

        return Result<StoryNodeDto>.Success(new StoryNodeDto(
            node.Id, node.StoryDetailId, node.Question, node.QuestionSubtitle, node.IsStart,
            node.BackgroundImageUrl, node.BackgroundColor, node.VideoUrl, node.AnimationType,
            node.SortOrder, new List<StoryNodeAnswerDto>()));
    }
}
