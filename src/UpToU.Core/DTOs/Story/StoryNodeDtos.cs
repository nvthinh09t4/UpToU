namespace UpToU.Core.DTOs.Story;

// ── Player-facing DTOs (scores hidden) ──────────────────────────────────────

/// <summary>Answer option shown to a player. Score values are intentionally omitted.</summary>
public record PlayerAnswerDto(
    int Id,
    string Text,
    string? TextVi,
    string? Color,
    int SortOrder,
    bool HasBranching
);

/// <summary>Story node presented to a player during interactive play.</summary>
public record PlayerStoryNodeDto(
    int Id,
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
    int SortOrder,
    List<PlayerAnswerDto> Answers
);

/// <summary>Popup data returned after the player selects an answer.</summary>
public record AnswerFeedbackDto(
    int AnswerId,
    Dictionary<string, int> ScoreDeltas,
    int TotalDelta,
    string? Feedback,
    string? FeedbackVi,
    int ChoiceCount,
    int TotalChoices
);

/// <summary>Definition of a score type dimension, included once with the story state.</summary>
public record CategoryScoreTypeDto(
    int Id,
    string Name,
    string? Label,
    decimal ScoreWeight,
    int OrderToShow
);

/// <summary>Full interactive story state returned to the player.</summary>
public record InteractiveStoryStateDto(
    int ProgressId,
    int StoryId,
    int StoryDetailId,
    bool IsCompleted,
    int TotalPointsEarned,
    Dictionary<string, int> ScoreTotals,
    List<CategoryScoreTypeDto> ScoreTypeDefinitions,
    PlayerStoryNodeDto? CurrentNode,
    int VisitedNodeCount,
    AnswerFeedbackDto? LastAnswerFeedback
);

// ── Admin-facing DTOs (all fields exposed) ──────────────────────────────────

/// <summary>Full answer DTO used in admin / node-graph editor.</summary>
public record StoryNodeAnswerDto(
    int Id,
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
);

public record StoryNodeDto(
    int Id,
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
    int SortOrder,
    List<StoryNodeAnswerDto> Answers
);

public record StoryNodeGraphDto(
    int StoryDetailId,
    int Revision,
    DateTime? EffectiveDate,
    List<StoryNodeDto> Nodes
);
