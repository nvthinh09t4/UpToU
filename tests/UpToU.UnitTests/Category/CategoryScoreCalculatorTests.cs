using FluentAssertions;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Services;

namespace UpToU.UnitTests.CategoryTests;

public class CategoryScoreCalculatorTests
{
    [Fact]
    public void ComputeCategoryScore_WhenAllKeysMatch_ReturnsSumOfWeightedValues()
    {
        // Arrange
        var scoreTotals = new Dictionary<string, int>
        {
            ["capital"]    = 10,
            ["experience"] = 20,
        };
        var scoreTypes = new List<CategoryScoreType>
        {
            new() { Name = "capital",    ScoreWeight = 2m  },
            new() { Name = "experience", ScoreWeight = 1.5m },
        };

        // Act
        var result = CategoryScoreCalculator.ComputeCategoryScore(scoreTotals, scoreTypes);

        // Assert
        result.Should().Be(50m); // 10*2 + 20*1.5 = 20 + 30
    }

    [Fact]
    public void ComputeCategoryScore_WhenKeyMissingFromTotals_TreatsAsMissing()
    {
        // Arrange
        var scoreTotals = new Dictionary<string, int>
        {
            ["capital"] = 10,
        };
        var scoreTypes = new List<CategoryScoreType>
        {
            new() { Name = "capital",  ScoreWeight = 2m },
            new() { Name = "missing",  ScoreWeight = 5m },
        };

        // Act
        var result = CategoryScoreCalculator.ComputeCategoryScore(scoreTotals, scoreTypes);

        // Assert
        result.Should().Be(20m); // only capital contributes: 10*2
    }

    [Fact]
    public void ComputeCategoryScore_WhenScoreTotalsEmpty_ReturnsZero()
    {
        // Arrange
        var scoreTypes = new List<CategoryScoreType>
        {
            new() { Name = "capital", ScoreWeight = 3m },
        };

        // Act
        var result = CategoryScoreCalculator.ComputeCategoryScore(new Dictionary<string, int>(), scoreTypes);

        // Assert
        result.Should().Be(0m);
    }

    [Fact]
    public void ComputeCategoryScore_WhenScoreTypesEmpty_ReturnsZero()
    {
        // Arrange
        var scoreTotals = new Dictionary<string, int> { ["capital"] = 10 };

        // Act
        var result = CategoryScoreCalculator.ComputeCategoryScore(scoreTotals, Enumerable.Empty<CategoryScoreType>());

        // Assert
        result.Should().Be(0m);
    }

    [Fact]
    public void ComputeTotalCreditScore_MultipleCategoriesWeightedCorrectly()
    {
        // Arrange
        var categoryScores = new List<(decimal CategoryScore, decimal CategoryWeight)>
        {
            (100m, 0.4m),
            (50m,  0.6m),
        };

        // Act
        var result = CategoryScoreCalculator.ComputeTotalCreditScore(categoryScores);

        // Assert
        result.Should().Be(70m); // 100*0.4 + 50*0.6
    }
}
