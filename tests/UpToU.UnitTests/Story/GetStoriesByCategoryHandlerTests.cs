using FluentAssertions;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;
using Microsoft.EntityFrameworkCore;

namespace UpToU.UnitTests.Story;

public class GetStoriesByCategoryHandlerTests
{
    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static Core.Entities.Story MakeStory(Category category, bool isPublish, bool isFeatured = false, DateTime? publishDate = null) =>
        new()
        {
            Title = isFeatured ? "Featured Story" : "Regular Story",
            CategoryId = category.Id,
            IsPublish = isPublish,
            IsFeatured = isFeatured,
            PublishDate = publishDate ?? DateTime.UtcNow,
            IsDeleted = false,
            CreatedOn = DateTime.UtcNow,
            StoryDetails = new List<StoryDetail>
            {
                new() { Revision = 1, IsPublish = true, SavePath = "/path", WordCount = 100, ScoreWeight = 1m, CreatedOn = DateTime.UtcNow }
            }
        };

    [Fact]
    public async Task Handle_ReturnsOnlyPublishedStories()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        db.Stories.AddRange(
            MakeStory(category, isPublish: true),
            MakeStory(category, isPublish: false)
        );
        await db.SaveChangesAsync();

        var handler = new GetStoriesByCategoryHandler(db);

        // Act
        var result = await handler.Handle(new GetStoriesByCategoryQuery(category.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        result.Value!.First().IsPublish.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_OrdersFeaturedStoriesFirst()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        db.Stories.AddRange(
            MakeStory(category, isPublish: true, isFeatured: false),
            MakeStory(category, isPublish: true, isFeatured: true)
        );
        await db.SaveChangesAsync();

        var handler = new GetStoriesByCategoryHandler(db);

        // Act
        var result = await handler.Handle(new GetStoriesByCategoryQuery(category.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.First().IsFeatured.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_OrdersNewerPublishDatesFirst_WhenFeaturedStatusIsEqual()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var older = MakeStory(category, isPublish: true, publishDate: DateTime.UtcNow.AddDays(-10));
        older.Title = "Older Story";
        var newer = MakeStory(category, isPublish: true, publishDate: DateTime.UtcNow);
        newer.Title = "Newer Story";
        db.Stories.AddRange(older, newer);
        await db.SaveChangesAsync();

        var handler = new GetStoriesByCategoryHandler(db);

        // Act
        var result = await handler.Handle(new GetStoriesByCategoryQuery(category.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.First().Title.Should().Be("Newer Story");
    }

    [Fact]
    public async Task Handle_UsesOnlyPublishedRevision_AsLatestDetail()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var story = new Core.Entities.Story
        {
            Title = "Multi-Revision Story",
            CategoryId = category.Id,
            IsPublish = true,
            IsDeleted = false,
            CreatedOn = DateTime.UtcNow,
            StoryDetails = new List<StoryDetail>
            {
                new() { Revision = 1, IsPublish = true,  Content = "Published content",   SavePath = "/path", WordCount = 10, ScoreWeight = 1m, CreatedOn = DateTime.UtcNow },
                new() { Revision = 2, IsPublish = false, Content = "Unpublished draft",   SavePath = "/path", WordCount = 20, ScoreWeight = 1m, CreatedOn = DateTime.UtcNow }
            }
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var handler = new GetStoriesByCategoryHandler(db);

        // Act
        var result = await handler.Handle(new GetStoriesByCategoryQuery(category.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var first = result.Value!.First();
        first.LatestDetail!.Content.Should().Be("Published content");
        first.LatestDetail.Revision.Should().Be(1);
    }

    [Fact]
    public async Task Handle_WhenNoCategoryStories_ReturnsEmptyList()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Empty", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var handler = new GetStoriesByCategoryHandler(db);

        // Act
        var result = await handler.Handle(new GetStoriesByCategoryQuery(category.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_DoesNotReturnStoriesFromOtherCategories()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var cat1 = new Category { Title = "Cat1", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        var cat2 = new Category { Title = "Cat2", IsActive = true, ScoreWeight = 1m, OrderToShow = 2 };
        db.Categories.AddRange(cat1, cat2);
        await db.SaveChangesAsync();

        db.Stories.AddRange(
            MakeStory(cat1, isPublish: true),
            MakeStory(cat2, isPublish: true)
        );
        await db.SaveChangesAsync();

        var handler = new GetStoriesByCategoryHandler(db);

        // Act
        var result = await handler.Handle(new GetStoriesByCategoryQuery(cat1.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        result.Value!.All(s => s.CategoryId == cat1.Id).Should().BeTrue();
    }
}
