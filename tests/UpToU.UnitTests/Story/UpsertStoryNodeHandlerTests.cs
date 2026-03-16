using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;
using UpToU.UnitTests.Infrastructure;

namespace UpToU.UnitTests.Story;

public class UpsertStoryNodeHandlerTests : IDisposable
{
    // Use SQLite so ExecuteUpdateAsync (IsStart enforcement) works correctly.
    private readonly ApplicationDbContext _db;
    private readonly Microsoft.Data.Sqlite.SqliteConnection _conn;

    public UpsertStoryNodeHandlerTests()
    {
        (_db, _conn) = SqliteTestDbContextFactory.Create();
    }

    public void Dispose()
    {
        _db.Dispose();
        _conn.Dispose();
    }

    private UpsertStoryNodeHandler CreateHandler() => new(_db);

    private static UpsertStoryNodeCommand CreateCommand(
        int storyDetailId,
        int? id = null,
        string question = "What do you do?",
        bool isStart = false,
        string? questionVi = null,
        string? questionSubtitleVi = null) =>
        new(
            Id: id,
            StoryDetailId: storyDetailId,
            Question: question,
            QuestionSubtitle: "A subtitle",
            QuestionVi: questionVi,
            QuestionSubtitleVi: questionSubtitleVi,
            IsStart: isStart,
            BackgroundImageUrl: null,
            BackgroundColor: "#1a1a2e",
            VideoUrl: null,
            AnimationType: "fade",
            SortOrder: 1
        );

    private async Task<StoryDetail> SeedDetailAsync()
    {
        var category = new Core.Entities.Category
        {
            Title = "Cat", IsActive = true, ScoreWeight = 1m, OrderToShow = 1,
        };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        var story = new Core.Entities.Story
        {
            Title = "S", CategoryId = category.Id, StoryType = "Interactive",
        };
        _db.Stories.Add(story);
        await _db.SaveChangesAsync();

        var detail = new StoryDetail { StoryId = story.Id, Revision = 1 };
        _db.StoryDetails.Add(detail);
        await _db.SaveChangesAsync();
        return detail;
    }

    // ── Tests ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenDetailNotFound_ReturnsNotFound()
    {
        // Arrange
        var handler = CreateHandler();
        var command = CreateCommand(storyDetailId: 9999);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("Story detail not found");
    }

    [Fact]
    public async Task Handle_WhenIdNotProvided_CreatesNewNode()
    {
        // Arrange
        var detail = await SeedDetailAsync();
        var handler = CreateHandler();
        var command = CreateCommand(detail.Id, question: "New question");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Id.Should().BeGreaterThan(0);
        result.Value.Question.Should().Be("New question");
        result.Value.StoryDetailId.Should().Be(detail.Id);

        var saved = await _db.StoryNodes.FindAsync(result.Value.Id);
        saved.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_WhenIdProvided_UpdatesExistingNode()
    {
        // Arrange
        var detail = await SeedDetailAsync();
        var existing = new StoryNode
        {
            StoryDetailId = detail.Id, Question = "Old question", SortOrder = 0,
        };
        _db.StoryNodes.Add(existing);
        await _db.SaveChangesAsync();

        var handler = CreateHandler();
        var command = CreateCommand(detail.Id, id: existing.Id, question: "Updated question");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Id.Should().Be(existing.Id);
        result.Value.Question.Should().Be("Updated question");

        await _db.Entry(existing).ReloadAsync();
        existing.Question.Should().Be("Updated question");
    }

    [Fact]
    public async Task Handle_WhenIdProvidedButNotFound_ReturnsNotFound()
    {
        // Arrange
        var detail = await SeedDetailAsync();
        var handler = CreateHandler();
        var command = CreateCommand(detail.Id, id: 88888);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task Handle_WhenIsStartTrue_ClearsOtherStartNodes()
    {
        // Arrange
        var detail = await SeedDetailAsync();
        var firstStart = new StoryNode
        {
            StoryDetailId = detail.Id, Question = "Old start", IsStart = true, SortOrder = 0,
        };
        _db.StoryNodes.Add(firstStart);
        await _db.SaveChangesAsync();

        var handler = CreateHandler();
        var command = CreateCommand(detail.Id, question: "New start", isStart: true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsStart.Should().BeTrue();

        await _db.Entry(firstStart).ReloadAsync();
        firstStart.IsStart.Should().BeFalse("the old start node should have been demoted");
    }

    [Fact]
    public async Task Handle_WhenViFieldsProvided_PersistsViContent()
    {
        // Arrange
        var detail = await SeedDetailAsync();
        var handler = CreateHandler();
        var command = CreateCommand(
            detail.Id,
            questionVi: "Câu hỏi tiếng Việt",
            questionSubtitleVi: "Phụ đề tiếng Việt");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.QuestionVi.Should().Be("Câu hỏi tiếng Việt");
        result.Value.QuestionSubtitleVi.Should().Be("Phụ đề tiếng Việt");

        var saved = await _db.StoryNodes.FindAsync(result.Value.Id);
        saved!.QuestionVi.Should().Be("Câu hỏi tiếng Việt");
        saved.QuestionSubtitleVi.Should().Be("Phụ đề tiếng Việt");
    }
}
