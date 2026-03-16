using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;

namespace UpToU.UnitTests.Story;

public class UpsertStoryNodeAnswerHandlerTests
{
    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static UpsertStoryNodeAnswerHandler CreateHandler(ApplicationDbContext db) => new(db);

    private static UpsertStoryNodeAnswerCommand DefaultCommand(
        int storyNodeId,
        int? id = null,
        int? nextNodeId = null,
        Dictionary<string, int>? branchWeights = null,
        string? textVi = null,
        string? feedbackVi = null) =>
        new(
            Id: id,
            StoryNodeId: storyNodeId,
            Text: "Pick this",
            TextVi: textVi,
            PointsAwarded: 10,
            ScoreDeltas: new Dictionary<string, int>(),
            NextNodeId: nextNodeId,
            BranchWeights: branchWeights ?? new Dictionary<string, int>(),
            Feedback: "Good choice.",
            FeedbackVi: feedbackVi,
            Color: "#2563eb",
            SortOrder: 0
        );

    private static async Task<(StoryDetail detail, StoryNode node1, StoryNode node2)>
        SeedGraphAsync(ApplicationDbContext db)
    {
        var category = new Core.Entities.Category
        {
            Title = "Cat", IsActive = true, ScoreWeight = 1m, OrderToShow = 1,
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var story = new Core.Entities.Story
        {
            Title = "S", CategoryId = category.Id, StoryType = "Interactive",
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var detail = new StoryDetail { StoryId = story.Id, Revision = 1 };
        db.StoryDetails.Add(detail);
        await db.SaveChangesAsync();

        var node1 = new StoryNode { StoryDetailId = detail.Id, Question = "Q1", IsStart = true, SortOrder = 0 };
        var node2 = new StoryNode { StoryDetailId = detail.Id, Question = "Q2", SortOrder = 1 };
        db.StoryNodes.AddRange(node1, node2);
        await db.SaveChangesAsync();

        return (detail, node1, node2);
    }

    // ── Tests ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenNodeNotFound_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = CreateHandler(db);
        var command = DefaultCommand(storyNodeId: 9999);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("Node not found");
    }

    [Fact]
    public async Task Handle_WhenMaxAnswersExceeded_ReturnsFailure()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, node1, node2) = await SeedGraphAsync(db);

        // Seed 5 answers (the max)
        for (var i = 0; i < 5; i++)
        {
            db.StoryNodeAnswers.Add(new StoryNodeAnswer
            {
                StoryNodeId = node1.Id, Text = $"Answer {i}", SortOrder = i,
                NextNodeId = node2.Id,
            });
        }
        await db.SaveChangesAsync();

        var handler = CreateHandler(db);
        var command = DefaultCommand(node1.Id, nextNodeId: node2.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("5");
    }

    [Fact]
    public async Task Handle_WhenCreatingAnswer_PersistsWithCorrectFields()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, node1, node2) = await SeedGraphAsync(db);
        var handler = CreateHandler(db);
        var command = DefaultCommand(node1.Id, nextNodeId: node2.Id,
            textVi: "Chọn cái này", feedbackVi: "Lựa chọn tốt.");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Text.Should().Be("Pick this");
        result.Value.TextVi.Should().Be("Chọn cái này");
        result.Value.Feedback.Should().Be("Good choice.");
        result.Value.FeedbackVi.Should().Be("Lựa chọn tốt.");
        result.Value.NextNodeId.Should().Be(node2.Id);

        var saved = await db.StoryNodeAnswers.FindAsync(result.Value.Id);
        saved!.TextVi.Should().Be("Chọn cái này");
        saved.FeedbackVi.Should().Be("Lựa chọn tốt.");
    }

    [Fact]
    public async Task Handle_WhenUpdatingAnswer_UpdatesExistingRecord()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, node1, node2) = await SeedGraphAsync(db);

        var existing = new StoryNodeAnswer
        {
            StoryNodeId = node1.Id, Text = "Old text", SortOrder = 0, NextNodeId = node2.Id,
        };
        db.StoryNodeAnswers.Add(existing);
        await db.SaveChangesAsync();

        var handler = CreateHandler(db);
        var command = DefaultCommand(node1.Id, id: existing.Id, nextNodeId: node2.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Id.Should().Be(existing.Id);
        result.Value.Text.Should().Be("Pick this");

        await db.Entry(existing).ReloadAsync();
        existing.Text.Should().Be("Pick this");
    }

    [Fact]
    public async Task Handle_WhenUpdateIdNotFound_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, node1, _) = await SeedGraphAsync(db);
        var handler = CreateHandler(db);
        var command = DefaultCommand(node1.Id, id: 77777);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task Handle_WhenBranchWeightsProvided_NullsNextNodeId()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, node1, node2) = await SeedGraphAsync(db);
        var handler = CreateHandler(db);
        var command = DefaultCommand(
            node1.Id,
            branchWeights: new Dictionary<string, int> { [node2.Id.ToString()] = 100 });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.NextNodeId.Should().BeNull("BranchWeights and NextNodeId are mutually exclusive");
        result.Value.BranchWeights.Should().ContainKey(node2.Id.ToString());
    }

    [Fact]
    public async Task Handle_WhenBranchWeightIsZero_ReturnsFailure()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, node1, node2) = await SeedGraphAsync(db);
        var handler = CreateHandler(db);
        var command = DefaultCommand(
            node1.Id,
            branchWeights: new Dictionary<string, int> { [node2.Id.ToString()] = 0 });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("positive");
    }

    [Fact]
    public async Task Handle_WhenBranchWeightKeyIsNotInteger_ReturnsFailure()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, node1, _) = await SeedGraphAsync(db);
        var handler = CreateHandler(db);
        var command = DefaultCommand(
            node1.Id,
            branchWeights: new Dictionary<string, int> { ["not-an-id"] = 50 });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not a valid node ID");
    }

    [Fact]
    public async Task Handle_WhenBranchWeightReferencesNodeInAnotherDetail_ReturnsFailure()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, node1, _) = await SeedGraphAsync(db);

        // Create a node in a completely different detail
        var otherDetail = new StoryDetail { StoryId = node1.StoryDetailId, Revision = 99 };
        db.StoryDetails.Add(otherDetail);
        var foreignNode = new StoryNode { StoryDetailId = otherDetail.Id, Question = "Q-other" };
        db.StoryNodes.Add(foreignNode);
        await db.SaveChangesAsync();

        var handler = CreateHandler(db);
        var command = DefaultCommand(
            node1.Id,
            branchWeights: new Dictionary<string, int> { [foreignNode.Id.ToString()] = 50 });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("same story revision");
    }

    [Fact]
    public async Task Handle_WhenNextNodeIdReferencesNodeInAnotherDetail_ReturnsFailure()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, node1, _) = await SeedGraphAsync(db);

        var otherDetail = new StoryDetail { StoryId = node1.StoryDetailId, Revision = 99 };
        db.StoryDetails.Add(otherDetail);
        var foreignNode = new StoryNode { StoryDetailId = otherDetail.Id, Question = "Q-other" };
        db.StoryNodes.Add(foreignNode);
        await db.SaveChangesAsync();

        var handler = CreateHandler(db);
        var command = DefaultCommand(node1.Id, nextNodeId: foreignNode.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("same story revision");
    }

    [Fact]
    public async Task Handle_WhenFifthAnswerAdded_Succeeds()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, node1, node2) = await SeedGraphAsync(db);

        // Seed exactly 4 answers (one below the max)
        for (var i = 0; i < 4; i++)
        {
            db.StoryNodeAnswers.Add(new StoryNodeAnswer
            {
                StoryNodeId = node1.Id, Text = $"Answer {i}", SortOrder = i,
                NextNodeId = node2.Id,
            });
        }
        await db.SaveChangesAsync();

        var handler = CreateHandler(db);
        var command = DefaultCommand(node1.Id, nextNodeId: node2.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var count = await db.StoryNodeAnswers.CountAsync(a => a.StoryNodeId == node1.Id);
        count.Should().Be(5);
    }
}
