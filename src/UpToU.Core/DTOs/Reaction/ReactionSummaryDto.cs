namespace UpToU.Core.DTOs.Reaction;

public record ReactionSummaryDto(
    int LikeCount,
    int LoveCount,
    int LaughCount,
    string? CurrentUserReaction
);
