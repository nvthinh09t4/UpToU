using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;

namespace UpToU.UnitTests.Story;

public class CreateStoryHandlerTests
{
    private readonly Mock<IHttpContextAccessor> _httpContextMock;

    public CreateStoryHandlerTests()
    {
        _httpContextMock = new Mock<IHttpContextAccessor>();
        _httpContextMock.Setup(x => x.HttpContext).Returns((HttpContext?)null);
    }

    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static CreateStoryCommand DefaultCommand(int categoryId, List<int>? tagIds = null) =>
        new(
            Title: "Test Story",
            Slug: "test-story",
            Description: "A description",
            Excerpt: "An excerpt",
            CoverImageUrl: null,
            AuthorName: "Author",
            IsFeatured: false,
            CategoryId: categoryId,
            PublishDate: DateTime.UtcNow,
            IsPublish: true,
            TagIds: tagIds ?? new List<int>(),
            SavePath: "/stories/test",
            Content: "# Hello\n\nContent here.",
            WordCount: 3,
            ScoreWeight: 1m
        );

    [Fact]
    public async Task Handle_WhenCategoryNotFound_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = new CreateStoryHandler(db, _httpContextMock.Object, NullLogger<CreateStoryHandler>.Instance);
        var command = DefaultCommand(categoryId: 999);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("Category not found");
    }

    [Fact]
    public async Task Handle_WhenCategoryExists_CreatesStoryWithRevisionOne()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var handler = new CreateStoryHandler(db, _httpContextMock.Object, NullLogger<CreateStoryHandler>.Instance);
        var command = DefaultCommand(categoryId: category.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Title.Should().Be("Test Story");
        result.Value.Slug.Should().Be("test-story");
        result.Value.IsPublish.Should().BeTrue();

        var savedStory = await db.Stories.Include(s => s.StoryDetails).FirstAsync();
        savedStory.StoryDetails.Should().HaveCount(1);
        savedStory.StoryDetails.First().Revision.Should().Be(1);
        savedStory.StoryDetails.First().Content.Should().Be("# Hello\n\nContent here.");
    }

    [Fact]
    public async Task Handle_WhenTagIdsProvided_AssociatesTagsWithStory()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        var tag1 = new Tag { Name = "dotnet" };
        var tag2 = new Tag { Name = "csharp" };
        db.Categories.Add(category);
        db.Tags.AddRange(tag1, tag2);
        await db.SaveChangesAsync();

        var handler = new CreateStoryHandler(db, _httpContextMock.Object, NullLogger<CreateStoryHandler>.Instance);
        var command = DefaultCommand(categoryId: category.Id, tagIds: new List<int> { tag1.Id, tag2.Id });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Tags.Should().HaveCount(2);
        result.Value.Tags.Select(t => t.Name).Should().BeEquivalentTo(new[] { "dotnet", "csharp" });
    }

    [Fact]
    public async Task Handle_WhenNoTagIds_CreatesStoryWithoutTags()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var handler = new CreateStoryHandler(db, _httpContextMock.Object, NullLogger<CreateStoryHandler>.Instance);
        var command = DefaultCommand(categoryId: category.Id, tagIds: new List<int>());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Tags.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WhenCreated_ReturnsCategoryTitle()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = new Category { Title = "Engineering", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var handler = new CreateStoryHandler(db, _httpContextMock.Object, NullLogger<CreateStoryHandler>.Instance);
        var command = DefaultCommand(categoryId: category.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.CategoryTitle.Should().Be("Engineering");
    }
}
