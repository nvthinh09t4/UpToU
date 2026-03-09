using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;

namespace UpToU.UnitTests.Story;

public class AddStoryDetailHandlerTests
{
    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static async Task<Core.Entities.Story> SeedStoryAsync(ApplicationDbContext db, bool isDeleted = false)
    {
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "My Story",
            CategoryId = category.Id,
            IsPublish = true,
            IsDeleted = isDeleted,
            CreatedOn = DateTime.UtcNow,
            StoryDetails = new List<StoryDetail>
            {
                new() { Revision = 1, IsPublish = true, SavePath = "/v1", Content = "v1", WordCount = 10, ScoreWeight = 1m, CreatedOn = DateTime.UtcNow }
            }
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();
        return story;
    }

    [Fact]
    public async Task Handle_WhenStoryNotFound_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = new AddStoryDetailHandler(db);
        var command = new AddStoryDetailCommand(StoryId: 999, SavePath: "/v2", Content: "New content", WordCount: 20, ChangeNotes: null, ScoreWeight: 1m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("Story not found");
    }

    [Fact]
    public async Task Handle_IncrementsRevisionNumber()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db);
        var handler = new AddStoryDetailHandler(db);
        var command = new AddStoryDetailCommand(StoryId: story.Id, SavePath: "/v2", Content: "Revision 2", WordCount: 20, ChangeNotes: "Second revision", ScoreWeight: 1m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Revision.Should().Be(2);
        result.Value.Content.Should().Be("Revision 2");
        result.Value.ChangeNotes.Should().Be("Second revision");
    }

    [Fact]
    public async Task Handle_TracksScoreWeightHistory_WhenWeightChanges()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db); // initial ScoreWeight = 1m
        var handler = new AddStoryDetailHandler(db);
        var command = new AddStoryDetailCommand(StoryId: story.Id, SavePath: "/v2", Content: "v2", WordCount: 20, ChangeNotes: null, ScoreWeight: 2m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.ScoreWeight.Should().Be(2m);
        result.Value.ScoreWeightHistory.Should().ContainSingle().Which.Should().Be(1m);
    }

    [Fact]
    public async Task Handle_DoesNotTrackScoreWeightHistory_WhenWeightUnchanged()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db); // initial ScoreWeight = 1m
        var handler = new AddStoryDetailHandler(db);
        var command = new AddStoryDetailCommand(StoryId: story.Id, SavePath: "/v2", Content: "v2", WordCount: 20, ChangeNotes: null, ScoreWeight: 1m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.ScoreWeight.Should().Be(1m);
        result.Value.ScoreWeightHistory.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_CanAddRevisionToSoftDeletedStory()
    {
        // Arrange — handler uses IgnoreQueryFilters so it can access deleted stories
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, isDeleted: true);
        var handler = new AddStoryDetailHandler(db);
        var command = new AddStoryDetailCommand(StoryId: story.Id, SavePath: "/v2", Content: "v2", WordCount: 20, ChangeNotes: null, ScoreWeight: 1m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Revision.Should().Be(2);
    }

    [Fact]
    public async Task Handle_SetsIsPublish_FromCommand()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db);
        var handler = new AddStoryDetailHandler(db);
        var command = new AddStoryDetailCommand(StoryId: story.Id, SavePath: "/v2", Content: "draft", WordCount: 5, ChangeNotes: null, ScoreWeight: 1m, IsPublish: false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsPublish.Should().BeFalse();
    }
}
