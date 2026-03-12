namespace UpToU.Core.DTOs.Leaderboard;

public record LeaderboardEntryDto(
    int Rank,
    string UserId,
    string DisplayName,
    string? MentionHandle,
    string? ActiveTitle,
    string? ActiveAvatarFrameUrl,
    string? AvatarUrl,
    int TotalCredits,
    int ActivityCount,
    string RankName,
    int RankStars
);

public record LeaderboardDto(
    string BoardType,
    int? CategoryId,
    string? CategoryTitle,
    string TimePeriod,
    List<LeaderboardEntryDto> Entries
);

public record LeaderboardSummaryDto(
    LeaderboardDto Overall,
    List<LeaderboardDto> ByCategory,
    LeaderboardDto MostActive
);
