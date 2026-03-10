using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;

namespace UpToU.UnitTests.Story;

public class DeleteStoryHandlerTests
{
    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenStoryNotFound_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = new DeleteStoryHandler(db);
        var command = new DeleteStoryCommand(999);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("Story not found");
    }

    [Fact]
    public async Task Handle_WhenValid_SoftDeletesStory()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "To Delete",
            CategoryId = category.Id,
            IsDeleted = false,
            CreatedOn = DateTime.UtcNow
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var handler = new DeleteStoryHandler(db);
        var command = new DeleteStoryCommand(story.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeTrue();

        var deleted = await db.Stories
            .IgnoreQueryFilters()
            .FirstAsync(s => s.Id == story.Id);
        deleted.IsDeleted.Should().BeTrue();
        deleted.ModifiedOn.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_WhenAlreadyDeleted_StillSoftDeletesSuccessfully()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "Already Deleted",
            CategoryId = category.Id,
            IsDeleted = true,
            CreatedOn = DateTime.UtcNow
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var handler = new DeleteStoryHandler(db);
        var command = new DeleteStoryCommand(story.Id);

        // Act
        // Handler uses IgnoreQueryFilters so it can still find the soft-deleted story
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenDeleted_StoryNoLongerAppearsInNormalQuery()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "Active Story",
            CategoryId = category.Id,
            IsDeleted = false,
            CreatedOn = DateTime.UtcNow
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var handler = new DeleteStoryHandler(db);

        // Act
        await handler.Handle(new DeleteStoryCommand(story.Id), CancellationToken.None);

        // Assert — global query filter hides soft-deleted stories
        var visible = await db.Stories.ToListAsync();
        visible.Should().BeEmpty();
    }
}
