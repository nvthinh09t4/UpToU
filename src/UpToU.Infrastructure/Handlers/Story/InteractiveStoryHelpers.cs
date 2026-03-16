using Microsoft.EntityFrameworkCore;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

/// <summary>Shared helpers for interactive story handlers.</summary>
internal static class InteractiveStoryHelpers
{
    internal static async Task<PlayerStoryNodeDto?> BuildPlayerNodeDtoAsync(
        ApplicationDbContext db, int nodeId, CancellationToken ct)
    {
        return await db.StoryNodes.AsNoTracking()
            .Where(n => n.Id == nodeId)
            .Select(n => new PlayerStoryNodeDto(
                n.Id, n.StoryDetailId,
                n.Question, n.QuestionSubtitle, n.QuestionVi, n.QuestionSubtitleVi,
                n.IsStart, n.BackgroundImageUrl, n.BackgroundColor,
                n.VideoUrl, n.AnimationType, n.SortOrder,
                n.Answers.OrderBy(a => a.SortOrder).ThenBy(a => a.Id)
                    .Select(a => new PlayerAnswerDto(
                        a.Id, a.Text, a.TextVi,
                        a.Color, a.SortOrder,
                        a.BranchWeights.Count > 0))
                    .ToList()))
            .FirstOrDefaultAsync(ct);
    }

    internal static async Task<InteractiveStoryStateDto> BuildStateAsync(
        ApplicationDbContext db,
        UserStoryProgress progress,
        int categoryId,
        AnswerFeedbackDto? feedback,
        CancellationToken ct)
    {
        var scoreTypes = await db.CategoryScoreTypes.AsNoTracking()
            .Where(st => st.CategoryId == categoryId)
            .OrderBy(st => st.OrderToShow)
            .Select(st => new CategoryScoreTypeDto(st.Id, st.Name, st.Label, st.ScoreWeight, st.OrderToShow))
            .ToListAsync(ct);

        PlayerStoryNodeDto? currentNodeDto = null;
        if (progress.CurrentNodeId.HasValue)
            currentNodeDto = await BuildPlayerNodeDtoAsync(db, progress.CurrentNodeId.Value, ct);

        var visitedCount = await db.UserStoryAnswers.CountAsync(a => a.ProgressId == progress.Id, ct);

        return new InteractiveStoryStateDto(
            progress.Id,
            progress.StoryId,
            progress.StoryDetailId,
            progress.IsCompleted,
            progress.TotalPointsEarned,
            progress.ScoreTotals,
            scoreTypes,
            currentNodeDto,
            visitedCount,
            feedback);
    }
}
