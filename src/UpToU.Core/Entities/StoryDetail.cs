namespace UpToU.Core.Entities;

public class StoryDetail
{
    public int Id { get; set; }
    public int StoryId { get; set; }
    public Story Story { get; set; } = null!;
    public int Revision { get; set; }
    public bool IsPublish { get; set; } = true;
    public string? Content { get; set; }
    public int WordCount { get; set; }
    public string? ChangeNotes { get; set; }
    public decimal ScoreWeight { get; set; } = 1m;
    public List<decimal> ScoreWeightHistory { get; set; } = new();
    public string SavePath { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
}
