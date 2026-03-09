using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;

namespace UpToU.UnitTests.Story;

public class GetStoryByIdHandlerTests
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
        var handler = new GetStoryByIdHandler(db);

        // Act
        var result = await handler.Handle(new GetStoryByIdQuery(999), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("Story not found");
    }

    [Fact]
    public async Task Handle_WhenStoryIsNotPublished_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "Draft Story",
            CategoryId = category.Id,
            IsPublish = false,
            IsDeleted = false,
            CreatedOn = DateTime.UtcNow,
            StoryDetails = new List<StoryDetail>
            {
                new() { Revision = 1, IsPublish = true, SavePath = "/path", WordCount = 100, ScoreWeight = 1m, CreatedOn = DateTime.UtcNow }
            }
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var handler = new GetStoryByIdHandler(db);

        // Act
        var result = await handler.Handle(new GetStoryByIdQuery(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task Handle_WhenPublished_ReturnsStoryWithLatestPublishedRevision()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "Published Story",
            CategoryId = category.Id,
            IsPublish = true,
            IsDeleted = false,
            CreatedOn = DateTime.UtcNow,
            StoryDetails = new List<StoryDetail>
            {
                new() { Revision = 1, IsPublish = true,  Content = "Rev1 content", SavePath = "/path", WordCount = 50,  ScoreWeight = 1m, CreatedOn = DateTime.UtcNow },
                new() { Revision = 2, IsPublish = true,  Content = "Rev2 content", SavePath = "/path", WordCount = 80,  ScoreWeight = 1m, CreatedOn = DateTime.UtcNow },
                new() { Revision = 3, IsPublish = false, Content = "Rev3 draft",   SavePath = "/path", WordCount = 120, ScoreWeight = 1m, CreatedOn = DateTime.UtcNow }
            }
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var handler = new GetStoryByIdHandler(db);

        // Act
        var result = await handler.Handle(new GetStoryByIdQuery(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Title.Should().Be("Published Story");
        result.Value.LatestDetail.Should().NotBeNull();
        result.Value.LatestDetail!.Revision.Should().Be(2);
        result.Value.LatestDetail.Content.Should().Be("Rev2 content");
    }

    [Fact]
    public async Task Handle_WhenNoPublishedRevisionExists_ReturnsNullLatestDetail()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "Published Story No Published Revision",
            CategoryId = category.Id,
            IsPublish = true,
            IsDeleted = false,
            CreatedOn = DateTime.UtcNow,
            StoryDetails = new List<StoryDetail>
            {
                new() { Revision = 1, IsPublish = false, Content = "Draft only", SavePath = "/path", WordCount = 10, ScoreWeight = 1m, CreatedOn = DateTime.UtcNow }
            }
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var handler = new GetStoryByIdHandler(db);

        // Act
        var result = await handler.Handle(new GetStoryByIdQuery(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.LatestDetail.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WhenPublished_ReturnsCategoryTitle()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Science", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "Science Story",
            CategoryId = category.Id,
            IsPublish = true,
            IsDeleted = false,
            CreatedOn = DateTime.UtcNow
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var handler = new GetStoryByIdHandler(db);

        // Act
        var result = await handler.Handle(new GetStoryByIdQuery(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.CategoryTitle.Should().Be("Science");
    }
}
