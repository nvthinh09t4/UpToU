namespace UpToU.Core.AI;

/// <summary>
/// Future-ready hook for AI integration. Implementations may analyze player behavior
/// to dynamically select the most contextually appropriate next node.
/// The default <see cref="NoOpStoryBehaviorEvaluator"/> always returns null (falls back to
/// deterministic / probabilistic branching).
/// </summary>
public interface IStoryBehaviorEvaluator
{
    /// <summary>
    /// Returns a node ID override, or null to let default branching proceed.
    /// </summary>
    Task<int?> SelectNextNodeAsync(PlayerBehaviorContext context, CancellationToken ct);
}

/// <summary>Captures all player state at the moment of a decision.</summary>
public record PlayerBehaviorContext(
    string UserId,
    int StoryId,
    int ProgressId,
    int CurrentNodeId,
    int ChosenAnswerId,
    Dictionary<string, int> AccumulatedScoreTotals,
    IReadOnlyList<PlayerDecision> DecisionHistory
);

/// <summary>A single recorded player decision.</summary>
public record PlayerDecision(
    int NodeId,
    int AnswerId,
    Dictionary<string, int> ScoreDeltas,
    DateTime AnsweredAt
);
