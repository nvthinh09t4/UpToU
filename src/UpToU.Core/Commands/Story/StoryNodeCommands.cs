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
    int PointsAwarded,
    int? NextNodeId,
    string? Color,
    int SortOrder
) : IRequest<Result<StoryNodeAnswerDto>>;

public record DeleteStoryNodeAnswerCommand(int Id) : IRequest<Result<bool>>;

// ── Client ────────────────────────────────────────────────────────────────────

public record StartOrResumeInteractiveStoryCommand(int StoryId) : IRequest<Result<InteractiveStoryStateDto>>;

public record SubmitStoryAnswerCommand(int ProgressId, int AnswerId) : IRequest<Result<InteractiveStoryStateDto>>;

public record GetInteractiveStoryProgressQuery(int StoryId) : IRequest<Result<InteractiveStoryStateDto?>>;
