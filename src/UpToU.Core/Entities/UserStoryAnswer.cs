namespace UpToU.Core.Entities;

public class UserStoryAnswer
{
    public int Id { get; set; }
    public int ProgressId { get; set; }
    public UserStoryProgress Progress { get; set; } = null!;
    public int NodeId { get; set; }
    public int AnswerId { get; set; }
    public int PointsAwarded { get; set; }
    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;
}
