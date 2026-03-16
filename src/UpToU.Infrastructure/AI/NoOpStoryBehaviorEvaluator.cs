using UpToU.Core.AI;

namespace UpToU.Infrastructure.AI;

/// <summary>Default no-op implementation. Always returns null, deferring to normal branching logic.</summary>
public class NoOpStoryBehaviorEvaluator : IStoryBehaviorEvaluator
{
    public Task<int?> SelectNextNodeAsync(PlayerBehaviorContext context, CancellationToken ct)
        => Task.FromResult<int?>(null);
}
