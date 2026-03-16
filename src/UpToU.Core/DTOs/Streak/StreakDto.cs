namespace UpToU.Core.DTOs.Streak;

public record StreakDto(
    int CurrentStreak,
    int LongestStreak,
    DateTime? LastCompletionDate,
    int NextMilestone,
    int CreditsAtNextMilestone
);
