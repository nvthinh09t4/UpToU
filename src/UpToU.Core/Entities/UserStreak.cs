namespace UpToU.Core.Entities;

public class UserStreak
{
    public int Id { get; set; }
    public string UserId { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateTime? LastCompletionDate { get; set; }
    public int LastAwardedMilestone { get; set; }
    public DateTime UpdatedAt { get; set; }
}
