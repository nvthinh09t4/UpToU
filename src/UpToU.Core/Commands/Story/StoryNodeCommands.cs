using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

// ── Admin ─────────────────────────────────────────────────────────────────────

public record GetStoryNodeGraphQuery(int StoryDetailId) : IRequest<Result<StoryNodeGraphDto>>;

public record UpsertStoryNodeCommand(
    int? Id,
    int StoryDetailId,
    string Question,
    string? QuestionSubtitle,
    string? QuestionVi,
    string? QuestionSubtitleVi,
    bool IsStart,
    string? BackgroundImageUrl,
    string? BackgroundColor,
    string? VideoUrl,
    string? AnimationType,
    int SortOrder
) : IRequest<Result<StoryNodeDto>>;

public record DeleteStoryNodeCommand(int Id) : IRequest<Result<bool>>;

public record UpsertStoryNodeAnswerCommand(
    int? Id,
    int StoryNodeId,
    string Text,
    string? TextVi,
    int PointsAwarded,
    Dictionary<string, int> ScoreDeltas,
    int? NextNodeId,
    Dictionary<string, int> BranchWeights,
    string? Feedback,
    string? FeedbackVi,
    string? Color,
    int SortOrder
) : IRequest<Result<StoryNodeAnswerDto>>;

public record DeleteStoryNodeAnswerCommand(int Id) : IRequest<Result<bool>>;

// ── Client ────────────────────────────────────────────────────────────────────

public record StartOrResumeInteractiveStoryCommand(int StoryId) : IRequest<Result<InteractiveStoryStateDto>>;

public record SubmitStoryAnswerCommand(int ProgressId, int AnswerId) : IRequest<Result<InteractiveStoryStateDto>>;

public record GetInteractiveStoryProgressQuery(int StoryId) : IRequest<Result<InteractiveStoryStateDto?>>;
