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

public class RejectStoryHandlerTests
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
        string status = StoryStatus.Submitted,
        string? authorId = "author-1")
    {
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "Story To Reject",
            CategoryId = category.Id,
            IsPublish = false,
            IsDeleted = false,
            Status = status,
            AuthorId = authorId,
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
        var handler = new RejectStoryHandler(db, httpMock.Object);
        var command = new RejectStoryCommand(999, "Not good enough");

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
        var handler = new RejectStoryHandler(db, httpMock.Object);
        var command = new RejectStoryCommand(story.Id, "Cannot reject a draft");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(409);
        result.Error.Should().Contain("Only submitted stories can be rejected");
    }

    [Fact]
    public async Task Handle_WhenSubmittedStory_RejectsAndSetsReason()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Submitted);
        var httpMock = CreateHttpContextMock("supervisor-2");
        var handler = new RejectStoryHandler(db, httpMock.Object);
        var command = new RejectStoryCommand(story.Id, "Needs more detail");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(StoryStatus.Rejected);

        var updated = await db.Stories.IgnoreQueryFilters().FirstAsync(s => s.Id == story.Id);
        updated.Status.Should().Be(StoryStatus.Rejected);
        updated.RejectionReason.Should().Be("Needs more detail");
        updated.ReviewedBy.Should().Be("supervisor-2");
        updated.ReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_WhenStoryHasAuthor_CreatesNotification()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Submitted, authorId: "author-42");
        var httpMock = CreateHttpContextMock("supervisor-3");
        var handler = new RejectStoryHandler(db, httpMock.Object);
        var command = new RejectStoryCommand(story.Id, "Too short");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        var notification = await db.Notifications.FirstOrDefaultAsync(n => n.RecipientId == "author-42");
        notification.Should().NotBeNull();
        notification!.Type.Should().Be("System");
        notification.Message.Should().Contain("Too short");
        notification.Message.Should().Contain("Story To Reject");
    }

    [Fact]
    public async Task Handle_WhenStoryHasNoAuthor_DoesNotCreateNotification()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Submitted, authorId: null);
        var httpMock = CreateHttpContextMock("supervisor-4");
        var handler = new RejectStoryHandler(db, httpMock.Object);
        var command = new RejectStoryCommand(story.Id, "No author story");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        var notificationCount = await db.Notifications.CountAsync();
        notificationCount.Should().Be(0);
    }

    [Fact]
    public async Task Handle_WhenAlreadyRejected_ReturnsConflict()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Rejected);
        var httpMock = CreateHttpContextMock("supervisor-5");
        var handler = new RejectStoryHandler(db, httpMock.Object);
        var command = new RejectStoryCommand(story.Id, "Rejecting again");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(409);
    }
}
