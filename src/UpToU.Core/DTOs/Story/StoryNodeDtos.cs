namespace UpToU.Core.DTOs.Story;

public record StoryNodeAnswerDto(
    int Id,
    string Text,
    int PointsAwarded,
    int? NextNodeId,
    string? Color,
    int SortOrder
);

public record StoryNodeDto(
    int Id,
    int StoryDetailId,
    string Question,
    string? QuestionSubtitle,
    bool IsStart,
    string? BackgroundImageUrl,
    string? BackgroundColor,
    string? VideoUrl,
    string? AnimationType,
    int SortOrder,
    List<StoryNodeAnswerDto> Answers
);

public record StoryNodeGraphDto(
    int StoryDetailId,
    int Revision,
    DateTime? EffectiveDate,
    List<StoryNodeDto> Nodes
);

public record InteractiveStoryStateDto(
    int ProgressId,
    int StoryId,
    int StoryDetailId,
    bool IsCompleted,
    int TotalPointsEarned,
    StoryNodeDto? CurrentNode,
    int VisitedNodeCount
);
