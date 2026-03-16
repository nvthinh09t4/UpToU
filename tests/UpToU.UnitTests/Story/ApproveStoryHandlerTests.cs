using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;

namespace UpToU.UnitTests.Story;

public class ApproveStoryHandlerTests
{
    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static Mock<IHttpContextAccessor> CreateHttpContextMock(string supervisorId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, supervisorId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };

        var mock = new Mock<IHttpContextAccessor>();
        mock.Setup(x => x.HttpContext).Returns(httpContext);
        return mock;
    }

    private static async Task<Core.Entities.Story> SeedStoryAsync(
        ApplicationDbContext db,
        string status = StoryStatus.Submitted)
    {
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "Pending Story",
            CategoryId = category.Id,
            IsPublish = false,
            IsDeleted = false,
            Status = status,
            AuthorId = "author-1",
            CreatedOn = DateTime.UtcNow,
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
        var httpMock = CreateHttpContextMock("supervisor-1");
        var handler = new ApproveStoryHandler(db, httpMock.Object);
        var command = new ApproveStoryCommand(999, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("Story not found");
    }

    [Fact]
    public async Task Handle_WhenStoryIsNotSubmitted_ReturnsConflict()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Draft);
        var httpMock = CreateHttpContextMock("supervisor-1");
        var handler = new ApproveStoryHandler(db, httpMock.Object);
        var command = new ApproveStoryCommand(story.Id, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(409);
        result.Error.Should().Contain("Only submitted stories can be approved");
    }

    [Fact]
    public async Task Handle_WhenPublishDateIsNull_PublishesImmediately()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Submitted);
        var httpMock = CreateHttpContextMock("supervisor-1");
        var handler = new ApproveStoryHandler(db, httpMock.Object);
        var command = new ApproveStoryCommand(story.Id, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(StoryStatus.Published);
        result.Value.IsPublish.Should().BeTrue();

        var updated = await db.Stories.IgnoreQueryFilters().FirstAsync(s => s.Id == story.Id);
        updated.Status.Should().Be(StoryStatus.Published);
        updated.IsPublish.Should().BeTrue();
        updated.ReviewedBy.Should().Be("supervisor-1");
        updated.ReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_WhenPublishDateIsInPast_PublishesImmediately()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Submitted);
        var httpMock = CreateHttpContextMock("supervisor-2");
        var handler = new ApproveStoryHandler(db, httpMock.Object);
        var pastDate = DateTime.UtcNow.AddDays(-1);
        var command = new ApproveStoryCommand(story.Id, pastDate);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(StoryStatus.Published);
        result.Value.IsPublish.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenPublishDateIsFuture_SetsApprovedStatusWithoutPublishing()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Submitted);
        var httpMock = CreateHttpContextMock("supervisor-3");
        var handler = new ApproveStoryHandler(db, httpMock.Object);
        var futureDate = DateTime.UtcNow.AddDays(7);
        var command = new ApproveStoryCommand(story.Id, futureDate);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(StoryStatus.Approved);
        result.Value.IsPublish.Should().BeFalse();

        var updated = await db.Stories.IgnoreQueryFilters().FirstAsync(s => s.Id == story.Id);
        updated.Status.Should().Be(StoryStatus.Approved);
        updated.IsPublish.Should().BeFalse();
        updated.PublishDate.Should().Be(futureDate);
    }

    [Fact]
    public async Task Handle_WhenApproved_ClearsRejectionReason()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Submitted);
        story.RejectionReason = "Old reason";
        await db.SaveChangesAsync();

        var httpMock = CreateHttpContextMock("supervisor-4");
        var handler = new ApproveStoryHandler(db, httpMock.Object);
        var command = new ApproveStoryCommand(story.Id, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        var updated = await db.Stories.IgnoreQueryFilters().FirstAsync(s => s.Id == story.Id);
        updated.RejectionReason.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WhenAlreadyPublished_ReturnsConflict()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Published);
        var httpMock = CreateHttpContextMock("supervisor-5");
        var handler = new ApproveStoryHandler(db, httpMock.Object);
        var command = new ApproveStoryCommand(story.Id, null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(409);
    }
}
