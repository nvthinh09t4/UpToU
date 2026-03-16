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

public class SubmitStoryHandlerTests
{
    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static Mock<IHttpContextAccessor> CreateHttpContextMock(
        string? userId = null,
        bool isAdmin = false,
        bool isSupervisor = false)
    {
        var mock = new Mock<IHttpContextAccessor>();

        if (userId is null)
        {
            mock.Setup(x => x.HttpContext).Returns((HttpContext?)null);
            return mock;
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId)
        };

        if (isAdmin)
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));

        if (isSupervisor)
            claims.Add(new Claim(ClaimTypes.Role, "Supervisor"));

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };

        mock.Setup(x => x.HttpContext).Returns(httpContext);
        return mock;
    }

    private static async Task<Core.Entities.Story> SeedStoryAsync(
        ApplicationDbContext db,
        string status = StoryStatus.Draft,
        string? authorId = null)
    {
        var category = new Category { Title = "Tech", IsActive = true, ScoreWeight = 1m, OrderToShow = 1 };
        db.Categories.Add(category);
        var story = new Core.Entities.Story
        {
            Title = "My Story",
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
        var httpMock = CreateHttpContextMock(userId: "user-1");
        var handler = new SubmitStoryHandler(db, httpMock.Object);
        var command = new SubmitStoryCommand(999);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("Story not found");
    }

    [Fact]
    public async Task Handle_WhenContributorSubmitsOwnDraftStory_Succeeds()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        const string authorId = "author-1";
        var story = await SeedStoryAsync(db, StoryStatus.Draft, authorId);
        var httpMock = CreateHttpContextMock(userId: authorId);
        var handler = new SubmitStoryHandler(db, httpMock.Object);
        var command = new SubmitStoryCommand(story.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(StoryStatus.Submitted);
    }

    [Fact]
    public async Task Handle_WhenContributorSubmitsOwnRejectedStory_Succeeds()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        const string authorId = "author-2";
        var story = await SeedStoryAsync(db, StoryStatus.Rejected, authorId);
        var httpMock = CreateHttpContextMock(userId: authorId);
        var handler = new SubmitStoryHandler(db, httpMock.Object);
        var command = new SubmitStoryCommand(story.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(StoryStatus.Submitted);
    }

    [Fact]
    public async Task Handle_WhenContributorSubmitsAnotherUsersStory_ReturnsForbidden()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Draft, authorId: "owner-user");
        var httpMock = CreateHttpContextMock(userId: "other-user");
        var handler = new SubmitStoryHandler(db, httpMock.Object);
        var command = new SubmitStoryCommand(story.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task Handle_WhenAdminSubmitsAnotherUsersStory_Succeeds()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Draft, authorId: "owner-user");
        var httpMock = CreateHttpContextMock(userId: "admin-user", isAdmin: true);
        var handler = new SubmitStoryHandler(db, httpMock.Object);
        var command = new SubmitStoryCommand(story.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(StoryStatus.Submitted);
    }

    [Fact]
    public async Task Handle_WhenSupervisorSubmitsAnotherUsersStory_Succeeds()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var story = await SeedStoryAsync(db, StoryStatus.Draft, authorId: "owner-user");
        var httpMock = CreateHttpContextMock(userId: "supervisor-user", isSupervisor: true);
        var handler = new SubmitStoryHandler(db, httpMock.Object);
        var command = new SubmitStoryCommand(story.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(StoryStatus.Submitted);
    }

    [Fact]
    public async Task Handle_WhenStoryIsAlreadySubmitted_ReturnsConflict()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        const string authorId = "author-3";
        var story = await SeedStoryAsync(db, StoryStatus.Submitted, authorId);
        var httpMock = CreateHttpContextMock(userId: authorId);
        var handler = new SubmitStoryHandler(db, httpMock.Object);
        var command = new SubmitStoryCommand(story.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task Handle_WhenStoryIsPublished_ReturnsConflict()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        const string authorId = "author-4";
        var story = await SeedStoryAsync(db, StoryStatus.Published, authorId);
        var httpMock = CreateHttpContextMock(userId: authorId);
        var handler = new SubmitStoryHandler(db, httpMock.Object);
        var command = new SubmitStoryCommand(story.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task Handle_WhenSubmitSucceeds_ClearsReviewFields()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        const string authorId = "author-5";
        var story = await SeedStoryAsync(db, StoryStatus.Rejected, authorId);
        story.ReviewedBy = "supervisor-1";
        story.ReviewedAt = DateTime.UtcNow.AddDays(-1);
        story.RejectionReason = "Needs work";
        await db.SaveChangesAsync();

        var httpMock = CreateHttpContextMock(userId: authorId);
        var handler = new SubmitStoryHandler(db, httpMock.Object);
        var command = new SubmitStoryCommand(story.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        var updated = await db.Stories.IgnoreQueryFilters().FirstAsync(s => s.Id == story.Id);
        updated.ReviewedBy.Should().BeNull();
        updated.ReviewedAt.Should().BeNull();
        updated.RejectionReason.Should().BeNull();
        updated.SubmittedAt.Should().NotBeNull();
    }
}
