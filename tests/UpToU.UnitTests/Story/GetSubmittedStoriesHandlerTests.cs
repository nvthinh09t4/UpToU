using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;

namespace UpToU.UnitTests.Story;

public class GetSubmittedStoriesHandlerTests
{
    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static async Task<Category> SeedCategoryAsync(ApplicationDbContext db)
    {
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category;
    }

    private static Core.Entities.Story MakeStory(
        Category category,
        string status,
        bool isDeleted = false,
        DateTime? submittedAt = null) =>
        new()
        {
            Title = $"Story [{status}]",
            CategoryId = category.Id,
            IsPublish = false,
            IsDeleted = isDeleted,
            Status = status,
            AuthorId = "author-1",
            SubmittedAt = submittedAt ?? (status == StoryStatus.Submitted ? DateTime.UtcNow : null),
            CreatedOn = DateTime.UtcNow,
        };

    [Fact]
    public async Task Handle_WhenNoSubmittedStories_ReturnsEmptyList()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = new GetSubmittedStoriesHandler(db);

        // Act
        var result = await handler.Handle(new GetSubmittedStoriesQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ReturnsOnlySubmittedStories()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = await SeedCategoryAsync(db);

        db.Stories.AddRange(
            MakeStory(category, StoryStatus.Submitted),
            MakeStory(category, StoryStatus.Draft),
            MakeStory(category, StoryStatus.Published),
            MakeStory(category, StoryStatus.Rejected)
        );
        await db.SaveChangesAsync();

        var handler = new GetSubmittedStoriesHandler(db);

        // Act
        var result = await handler.Handle(new GetSubmittedStoriesQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        result.Value!.First().Status.Should().Be(StoryStatus.Submitted);
    }

    [Fact]
    public async Task Handle_ExcludesSoftDeletedSubmittedStories()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = await SeedCategoryAsync(db);

        db.Stories.AddRange(
            MakeStory(category, StoryStatus.Submitted, isDeleted: false),
            MakeStory(category, StoryStatus.Submitted, isDeleted: true)
        );
        await db.SaveChangesAsync();

        var handler = new GetSubmittedStoriesHandler(db);

        // Act
        var result = await handler.Handle(new GetSubmittedStoriesQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
    }

    [Fact]
    public async Task Handle_ReturnsStoriesOrderedBySubmittedAt_Ascending()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = await SeedCategoryAsync(db);

        var earlier = MakeStory(category, StoryStatus.Submitted, submittedAt: DateTime.UtcNow.AddHours(-5));
        earlier.Title = "Earliest";
        var later = MakeStory(category, StoryStatus.Submitted, submittedAt: DateTime.UtcNow);
        later.Title = "Latest";

        db.Stories.AddRange(later, earlier);
        await db.SaveChangesAsync();

        var handler = new GetSubmittedStoriesHandler(db);

        // Act
        var result = await handler.Handle(new GetSubmittedStoriesQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(2);
        result.Value!.First().Title.Should().Be("Earliest");
        result.Value.Last().Title.Should().Be("Latest");
    }

    [Fact]
    public async Task Handle_ReturnsMultipleSubmittedStories()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = await SeedCategoryAsync(db);

        db.Stories.AddRange(
            MakeStory(category, StoryStatus.Submitted),
            MakeStory(category, StoryStatus.Submitted),
            MakeStory(category, StoryStatus.Submitted)
        );
        await db.SaveChangesAsync();

        var handler = new GetSubmittedStoriesHandler(db);

        // Act
        var result = await handler.Handle(new GetSubmittedStoriesQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(3);
        result.Value!.All(s => s.Status == StoryStatus.Submitted).Should().BeTrue();
    }
}
