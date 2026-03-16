namespace UpToU.Core.DTOs.Leaderboard;

public record ContributorLeaderboardEntryDto(
    int    Rank,
    string UserId,
    string DisplayName,
    string? MentionHandle,
    string? ActiveTitle,
    string? ActiveAvatarFrameUrl,
    string? AvatarUrl,
    int    ContributedPoints,
    int    UniqueReaders,
    /// <summary>True when this user currently holds the exclusive Contributor Champion title.</summary>
    bool   IsChampion
);

public record ContributorLeaderboardDto(
    string BoardType,
    IReadOnlyList<ContributorLeaderboardEntryDto> Entries
);
