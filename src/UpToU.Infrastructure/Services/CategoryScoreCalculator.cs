using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Services;

/// <summary>
/// Stateless utility for weighted category score calculations.
/// Category score = Σ(score_type_value × score_type_weight).
/// Total credit score = Σ(category_score × category_weight).
/// </summary>
public static class CategoryScoreCalculator
{
    public static decimal ComputeCategoryScore(
        Dictionary<string, int> scoreTotals,
        IEnumerable<CategoryScoreType> scoreTypes)
        => scoreTypes.Sum(st =>
            scoreTotals.TryGetValue(st.Name, out var v) ? v * st.ScoreWeight : 0m);

    public static decimal ComputeTotalCreditScore(
        IEnumerable<(decimal CategoryScore, decimal CategoryWeight)> categoryScores)
        => categoryScores.Sum(x => x.CategoryScore * x.CategoryWeight);
}
