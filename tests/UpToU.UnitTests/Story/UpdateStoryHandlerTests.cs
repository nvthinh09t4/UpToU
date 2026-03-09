using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;

namespace UpToU.UnitTests.Story;

public class UpdateStoryHandlerTests
{
    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static UpdateStoryCommand BuildCommand(int id, int categoryId, List<int>? tagIds = null) =>
        new(
            Id: id,
            Title: "Updated Title",
            Slug: "updated-slug",
            Description: "Updated description",
            Excerpt: "Updated excerpt",
            CoverImageUrl: "https://example.com/img.jpg",
            AuthorName: "New Author",
            IsFeatured: true,
            CategoryId: categoryId,
            PublishDate: DateTime.UtcNow,
            IsPublish: true,
            TagIds: tagIds ?? new List<int>()
        );

    [Fact]
    public async Task Handle_WhenStoryNotFound_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = new UpdateStoryHandler(db);
        var command = BuildCommand(id: 999, categoryId: 1);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("Story not found");
    }

    [Fact]
    public async Task Handle_WhenCategoryNotFound_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Original", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "Old Title",
            CategoryId = category.Id,
            IsPublish = false,
            CreatedOn = DateTime.UtcNow
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var handler = new UpdateStoryHandler(db);
        var command = BuildCommand(id: story.Id, categoryId: 999);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("Category not found");
    }

    [Fact]
    public async Task Handle_WhenValid_UpdatesStoryFields()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "Old Title",
            CategoryId = category.Id,
            IsPublish = false,
            IsFeatured = false,
            CreatedOn = DateTime.UtcNow
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var handler = new UpdateStoryHandler(db);
        var command = BuildCommand(id: story.Id, categoryId: category.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Title.Should().Be("Updated Title");
        result.Value.Slug.Should().Be("updated-slug");
        result.Value.IsFeatured.Should().BeTrue();
        result.Value.AuthorName.Should().Be("New Author");
        result.Value.CoverImageUrl.Should().Be("https://example.com/img.jpg");

        var saved = await db.Stories.FindAsync(story.Id);
        saved!.ModifiedOn.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_WhenTagsProvided_ReplacesExistingTags()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        var oldTag = new Tag { Name = "old-tag" };
        var newTag = new Tag { Name = "new-tag" };
        db.Categories.Add(category);
        db.Tags.AddRange(oldTag, newTag);
        var story = new Core.Entities.Story
        {
            Title = "Story",
            CategoryId = category.Id,
            Tags = new List<Tag> { oldTag },
            CreatedOn = DateTime.UtcNow
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var handler = new UpdateStoryHandler(db);
        var command = BuildCommand(id: story.Id, categoryId: category.Id, tagIds: new List<int> { newTag.Id });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Tags.Should().HaveCount(1);
        result.Value.Tags.First().Name.Should().Be("new-tag");
    }
}
