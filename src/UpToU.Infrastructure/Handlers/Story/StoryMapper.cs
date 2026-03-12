using UpToU.Core.DTOs.Story;
using StoryEntity = UpToU.Core.Entities.Story;
using StoryDetailEntity = UpToU.Core.Entities.StoryDetail;

namespace UpToU.Infrastructure.Handlers.Story;

internal static class StoryMapper
{
    internal static StoryDetailDto MapDetailToDto(StoryDetailEntity d) => new(
        d.Id, d.StoryId, d.Revision, d.IsPublish, d.Content,
        d.WordCount, d.ChangeNotes, d.ScoreWeight, d.ScoreWeightHistory,
        d.SavePath, d.CreatedOn, d.CreatedBy
    );

    internal static StoryDto MapToDto(
        StoryEntity s,
        bool publishedRevisionOnly = false,
        int upvoteCount = 0,
        int downvoteCount = 0,
        string? currentUserVote = null,
        bool isBookmarked = false)
    {
        var latestDetail = publishedRevisionOnly
            ? s.StoryDetails.Where(d => d.IsPublish).OrderByDescending(d => d.Revision).FirstOrDefault()
            : s.StoryDetails.OrderByDescending(d => d.Revision).FirstOrDefault();

        return new StoryDto(
            s.Id, s.Title, s.Slug, s.Description, s.Excerpt, s.CoverImageUrl,
            s.AuthorName, s.IsFeatured, s.PublishDate, s.IsPublish, s.IsDeleted, s.StoryType,
            s.CategoryId, s.Category?.Title ?? string.Empty,
            s.CreatedOn, s.ModifiedOn, s.CreatedBy, s.ModifiedBy,
            s.Tags.Select(t => new TagDto(t.Id, t.Name)).ToList(),
            latestDetail is null ? null : MapDetailToDto(latestDetail),
            s.ViewCount,
            upvoteCount,
            downvoteCount,
            currentUserVote,
            isBookmarked,
            s.AuthorId,
            s.Status,
            s.SubmittedAt,
            s.ReviewedBy,
            s.ReviewedAt,
            s.RejectionReason,
            s.AssignedSupervisorId
        );
    }
}
