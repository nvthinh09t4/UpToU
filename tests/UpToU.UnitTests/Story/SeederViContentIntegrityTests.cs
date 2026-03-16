using System.Reflection;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Seed;
using UpToU.UnitTests.Infrastructure;

namespace UpToU.UnitTests.Story;

/// <summary>
/// Verifies that the interactive story seeder populates Vietnamese content
/// (QuestionVi, QuestionSubtitleVi, TextVi, FeedbackVi) for all nodes and answers.
/// Uses reflection to call the private SeedInteractiveStoriesAsync method so we can
/// test seeder integrity without needing a full UserManager / RoleManager setup.
/// </summary>
public class SeederViContentIntegrityTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly Microsoft.Data.Sqlite.SqliteConnection _conn;

    public SeederViContentIntegrityTests()
    {
        (_db, _conn) = SqliteTestDbContextFactory.Create();
    }

    public void Dispose()
    {
        _db.Dispose();
        _conn.Dispose();
    }

    /// <summary>Seeds the minimum categories and then calls SeedInteractiveStoriesAsync.</summary>
    private async Task RunInteractiveSeederAsync()
    {
        // Seed the two categories that the interactive stories reference
        var categories = new List<Core.Entities.Category>
        {
            new() { Title = "Real Life",  IsActive = true, ScoreWeight = 1m, OrderToShow = 1 },
            new() { Title = "Mindset",    IsActive = true, ScoreWeight = 1m, OrderToShow = 2 },
        };
        _db.Categories.AddRange(categories);
        await _db.SaveChangesAsync();

        // Invoke the private static method via reflection
        var method = typeof(DatabaseSeeder).GetMethod(
            "SeedInteractiveStoriesAsync",
            BindingFlags.NonPublic | BindingFlags.Static);

        method.Should().NotBeNull("DatabaseSeeder.SeedInteractiveStoriesAsync must exist as a private static method");

        await (Task)method!.Invoke(null, new object[] { _db, categories })!;
    }

    // ── Washing Machine Dilemma ───────────────────────────────────────────────

    [Fact]
    public async Task WashingMachineDilemma_AllNodesHaveQuestionVi()
    {
        // Arrange & Act
        await RunInteractiveSeederAsync();
        var story = await _db.Stories.FirstAsync(s => s.Slug == "washing-machine-dilemma");
        var nodes = await _db.StoryDetails
            .Where(d => d.StoryId == story.Id)
            .SelectMany(d => d.StoryNodes)
            .ToListAsync();

        // Assert
        nodes.Should().NotBeEmpty();
        nodes.Should().AllSatisfy(n =>
            n.QuestionVi.Should().NotBeNullOrWhiteSpace(
                $"node '{n.Question}' is missing QuestionVi"));
    }

    [Fact]
    public async Task WashingMachineDilemma_AllAnswersHaveTextVi()
    {
        // Arrange & Act
        await RunInteractiveSeederAsync();
        var story = await _db.Stories.FirstAsync(s => s.Slug == "washing-machine-dilemma");
        var answers = await _db.StoryDetails
            .Where(d => d.StoryId == story.Id)
            .SelectMany(d => d.StoryNodes)
            .SelectMany(n => n.Answers)
            .ToListAsync();

        // Assert
        answers.Should().NotBeEmpty();
        answers.Should().AllSatisfy(a =>
            a.TextVi.Should().NotBeNullOrWhiteSpace(
                $"answer '{a.Text}' is missing TextVi"));
    }

    [Fact]
    public async Task WashingMachineDilemma_AllAnswersHaveFeedbackVi()
    {
        // Arrange & Act
        await RunInteractiveSeederAsync();
        var story = await _db.Stories.FirstAsync(s => s.Slug == "washing-machine-dilemma");
        var answers = await _db.StoryDetails
            .Where(d => d.StoryId == story.Id)
            .SelectMany(d => d.StoryNodes)
            .SelectMany(n => n.Answers)
            .Where(a => a.Feedback != null) // only check answers that have English feedback
            .ToListAsync();

        // Assert
        answers.Should().NotBeEmpty();
        answers.Should().AllSatisfy(a =>
            a.FeedbackVi.Should().NotBeNullOrWhiteSpace(
                $"answer '{a.Text}' has English feedback but is missing FeedbackVi"));
    }

    // ── Game or Learn ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GameOrLearn_AllNodesHaveQuestionVi()
    {
        // Arrange & Act
        await RunInteractiveSeederAsync();
        var story = await _db.Stories.FirstAsync(s => s.Slug == "game-or-learn-lazy-day");
        var nodes = await _db.StoryDetails
            .Where(d => d.StoryId == story.Id)
            .SelectMany(d => d.StoryNodes)
            .ToListAsync();

        // Assert
        nodes.Should().NotBeEmpty();
        nodes.Should().AllSatisfy(n =>
            n.QuestionVi.Should().NotBeNullOrWhiteSpace(
                $"node '{n.Question}' is missing QuestionVi"));
    }

    [Fact]
    public async Task GameOrLearn_AllAnswersHaveTextVi()
    {
        // Arrange & Act
        await RunInteractiveSeederAsync();
        var story = await _db.Stories.FirstAsync(s => s.Slug == "game-or-learn-lazy-day");
        var answers = await _db.StoryDetails
            .Where(d => d.StoryId == story.Id)
            .SelectMany(d => d.StoryNodes)
            .SelectMany(n => n.Answers)
            .ToListAsync();

        // Assert
        answers.Should().NotBeEmpty();
        answers.Should().AllSatisfy(a =>
            a.TextVi.Should().NotBeNullOrWhiteSpace(
                $"answer '{a.Text}' is missing TextVi"));
    }

    [Fact]
    public async Task GameOrLearn_AllAnswersHaveFeedbackVi()
    {
        // Arrange & Act
        await RunInteractiveSeederAsync();
        var story = await _db.Stories.FirstAsync(s => s.Slug == "game-or-learn-lazy-day");
        var answers = await _db.StoryDetails
            .Where(d => d.StoryId == story.Id)
            .SelectMany(d => d.StoryNodes)
            .SelectMany(n => n.Answers)
            .Where(a => a.Feedback != null)
            .ToListAsync();

        // Assert
        answers.Should().NotBeEmpty();
        answers.Should().AllSatisfy(a =>
            a.FeedbackVi.Should().NotBeNullOrWhiteSpace(
                $"answer '{a.Text}' has English feedback but is missing FeedbackVi"));
    }

    // ── Idempotency ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Seeder_WhenRunTwice_DoesNotDuplicateStories()
    {
        // Arrange & Act
        await RunInteractiveSeederAsync();
        await RunInteractiveSeederAsync(); // second run should skip

        // Assert
        var count = await _db.Stories
            .Where(s => s.Slug == "washing-machine-dilemma" || s.Slug == "game-or-learn-lazy-day")
            .CountAsync();
        count.Should().Be(2, "each story should only be seeded once");
    }

    // ── Node structure ────────────────────────────────────────────────────────

    [Fact]
    public async Task BothStories_EachHaveExactlyOneStartNode()
    {
        // Arrange & Act
        await RunInteractiveSeederAsync();

        var slugs = new[] { "washing-machine-dilemma", "game-or-learn-lazy-day" };
        foreach (var slug in slugs)
        {
            var story = await _db.Stories.FirstAsync(s => s.Slug == slug);
            var startNodeCount = await _db.StoryDetails
                .Where(d => d.StoryId == story.Id)
                .SelectMany(d => d.StoryNodes)
                .CountAsync(n => n.IsStart);

            startNodeCount.Should().Be(1, $"story '{slug}' must have exactly one start node");
        }
    }

    [Fact]
    public async Task WashingMachineDilemma_HasSevenNodes()
    {
        // Arrange & Act
        await RunInteractiveSeederAsync();
        var story = await _db.Stories.FirstAsync(s => s.Slug == "washing-machine-dilemma");
        var nodeCount = await _db.StoryDetails
            .Where(d => d.StoryId == story.Id)
            .SelectMany(d => d.StoryNodes)
            .CountAsync();

        nodeCount.Should().Be(7);
    }

    [Fact]
    public async Task GameOrLearn_HasEightNodes()
    {
        // Arrange & Act
        await RunInteractiveSeederAsync();
        var story = await _db.Stories.FirstAsync(s => s.Slug == "game-or-learn-lazy-day");
        var nodeCount = await _db.StoryDetails
            .Where(d => d.StoryId == story.Id)
            .SelectMany(d => d.StoryNodes)
            .CountAsync();

        nodeCount.Should().Be(8);
    }
}
