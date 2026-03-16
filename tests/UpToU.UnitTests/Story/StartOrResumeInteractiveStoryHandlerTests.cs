using System.Security.Claims;
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

public class StartOrResumeInteractiveStoryHandlerTests
{
    private const string UserId = "test-user-42";

    // ── Factories ─────────────────────────────────────────────────────────────

    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static Mock<IHttpContextAccessor> CreateHttpContextMock(string? userId = UserId)
    {
        var mock = new Mock<IHttpContextAccessor>();
        if (userId is null)
        {
            mock.Setup(x => x.HttpContext).Returns((HttpContext?)null);
        }
        else
        {
            var claims    = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
            var identity  = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            mock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = principal });
        }
        return mock;
    }

    private static StartOrResumeInteractiveStoryHandler CreateHandler(
        ApplicationDbContext db, Mock<IHttpContextAccessor> httpMock) =>
        new(db, httpMock.Object, NullLogger<StartOrResumeInteractiveStoryHandler>.Instance);

    /// <summary>Builds a fully wired interactive story with a start node.</summary>
    private static async Task<(Core.Entities.Category category, Core.Entities.Story story, StoryDetail detail, StoryNode startNode)>
        SeedInteractiveStoryAsync(ApplicationDbContext db, bool published = true, string storyType = "Interactive")
    {
        var category = new Core.Entities.Category
        {
            Title = "Test", IsActive = true, ScoreWeight = 1m, OrderToShow = 1,
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var story = new Core.Entities.Story
        {
            Title = "Test Story", CategoryId = category.Id,
            StoryType = storyType, IsPublish = published, Status = StoryStatus.Published,
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var detail = new StoryDetail
        {
            StoryId = story.Id, Revision = 1, IsPublish = true,
            EffectiveDate = DateTime.UtcNow.AddDays(-1),
        };
        db.StoryDetails.Add(detail);
        await db.SaveChangesAsync();

        var startNode = new StoryNode
        {
            StoryDetailId = detail.Id, Question = "First question", IsStart = true, SortOrder = 0,
            Answers = new List<StoryNodeAnswer>(),
        };
        db.StoryNodes.Add(startNode);
        await db.SaveChangesAsync();

        return (category, story, detail, startNode);
    }

    // ── Tests ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenUserNotAuthenticated_ReturnsUnauthorized()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = CreateHandler(db, CreateHttpContextMock(userId: null));

        // Act
        var result = await handler.Handle(new StartOrResumeInteractiveStoryCommand(1), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(401);
    }

    [Fact]
    public async Task Handle_WhenStoryDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = CreateHandler(db, CreateHttpContextMock());

        // Act
        var result = await handler.Handle(new StartOrResumeInteractiveStoryCommand(999), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task Handle_WhenStoryIsNotInteractive_ReturnsFailure()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        await SeedInteractiveStoryAsync(db, storyType: "Article");
        var story = await db.Stories.FirstAsync();
        var handler = CreateHandler(db, CreateHttpContextMock());

        // Act
        var result = await handler.Handle(new StartOrResumeInteractiveStoryCommand(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not interactive");
    }

    [Fact]
    public async Task Handle_WhenStoryNotPublished_ReturnsFailure()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        await SeedInteractiveStoryAsync(db, published: false);
        var story = await db.Stories.FirstAsync();
        var handler = CreateHandler(db, CreateHttpContextMock());

        // Act
        var result = await handler.Handle(new StartOrResumeInteractiveStoryCommand(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not published");
    }

    [Fact]
    public async Task Handle_WhenNoActiveDetail_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, story, detail, _) = await SeedInteractiveStoryAsync(db);

        // Make the detail unpublished so no active detail exists
        detail.IsPublish = false;
        await db.SaveChangesAsync();

        var handler = CreateHandler(db, CreateHttpContextMock());

        // Act
        var result = await handler.Handle(new StartOrResumeInteractiveStoryCommand(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("active");
    }

    [Fact]
    public async Task Handle_WhenNoStartNode_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, story, _, startNode) = await SeedInteractiveStoryAsync(db);

        // Remove start node
        db.StoryNodes.Remove(startNode);
        await db.SaveChangesAsync();

        var handler = CreateHandler(db, CreateHttpContextMock());

        // Act
        var result = await handler.Handle(new StartOrResumeInteractiveStoryCommand(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("start node");
    }

    [Fact]
    public async Task Handle_WhenNewUser_CreatesProgressAndReturnsState()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, story, _, startNode) = await SeedInteractiveStoryAsync(db);
        var handler = CreateHandler(db, CreateHttpContextMock());

        // Act
        var result = await handler.Handle(new StartOrResumeInteractiveStoryCommand(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsCompleted.Should().BeFalse();
        result.Value.CurrentNode.Should().NotBeNull();
        result.Value.CurrentNode!.Id.Should().Be(startNode.Id);
        result.Value.VisitedNodeCount.Should().Be(0);

        var progress = await db.UserStoryProgresses.FirstOrDefaultAsync();
        progress.Should().NotBeNull();
        progress!.UserId.Should().Be(UserId);
        progress.StoryId.Should().Be(story.Id);
        progress.CurrentNodeId.Should().Be(startNode.Id);
        progress.IsCompleted.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenProgressAlreadyExists_ResumesExistingProgress()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, story, detail, startNode) = await SeedInteractiveStoryAsync(db);

        // Seed a second node and existing progress pointing to it
        var node2 = new StoryNode { StoryDetailId = detail.Id, Question = "Q2", SortOrder = 1 };
        db.StoryNodes.Add(node2);
        await db.SaveChangesAsync();

        var existing = new UserStoryProgress
        {
            UserId = UserId, StoryId = story.Id, StoryDetailId = detail.Id,
            CurrentNodeId = node2.Id, IsCompleted = false, ScoreTotals = new Dictionary<string, int>(),
        };
        db.UserStoryProgresses.Add(existing);
        await db.SaveChangesAsync();

        var handler = CreateHandler(db, CreateHttpContextMock());

        // Act
        var result = await handler.Handle(new StartOrResumeInteractiveStoryCommand(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.CurrentNode!.Id.Should().Be(node2.Id);
        result.Value.ProgressId.Should().Be(existing.Id);

        // Exactly one progress record — no duplicate created
        var progressCount = await db.UserStoryProgresses.CountAsync();
        progressCount.Should().Be(1);
    }

    [Fact]
    public async Task Handle_WhenNewUser_ReturnsEmptyScoreTotals()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, story, _, _) = await SeedInteractiveStoryAsync(db);
        var handler = CreateHandler(db, CreateHttpContextMock());

        // Act
        var result = await handler.Handle(new StartOrResumeInteractiveStoryCommand(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.ScoreTotals.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WhenDetailHasFutureEffectiveDate_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (_, story, detail, _) = await SeedInteractiveStoryAsync(db);

        // Push the effective date into the future
        detail.EffectiveDate = DateTime.UtcNow.AddDays(7);
        await db.SaveChangesAsync();

        var handler = CreateHandler(db, CreateHttpContextMock());

        // Act
        var result = await handler.Handle(new StartOrResumeInteractiveStoryCommand(story.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
    }
}
