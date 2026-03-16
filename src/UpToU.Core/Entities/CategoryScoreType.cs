namespace UpToU.Core.Entities;

public class CategoryScoreType
{
    public int Id { get; set; }

    /// <summary>Identifier name for this score dimension, e.g. "capital", "experience", "mindset", "health".</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Display label shown in the UI (can differ from Name).</summary>
    public string? Label { get; set; }

    /// <summary>Weight used when computing the category's aggregate score: aggregate = Σ(userScore × ScoreWeight).</summary>
    public decimal ScoreWeight { get; set; } = 1m;

    public int OrderToShow { get; set; } = 0;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}
