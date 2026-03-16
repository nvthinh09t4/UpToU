using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using UpToU.Core.AI;
using UpToU.Core.Entities;
using UpToU.Core.Interfaces;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;
using UpToU.UnitTests.Infrastructure;

namespace UpToU.UnitTests.Story;

public class SubmitStoryAnswerHandlerTests
{
    private const string UserId = "test-user-1";

    // ── Factories ─────────────────────────────────────────────────────────────

    // Uses SQLite because SubmitStoryAnswerHandler calls ExecuteUpdateAsync (ChoiceCount),
    // which is not supported by the EF Core InMemory provider.
    private sealed record TestDb(ApplicationDbContext Db, Microsoft.Data.Sqlite.SqliteConnection Conn) : IDisposable
    {
        public void Dispose() { Db.Dispose(); Conn.Dispose(); }
    }

    private static TestDb CreateDb()
    {
        var (db, conn) = SqliteTestDbContextFactory.Create();
        return new TestDb(db, conn);
    }

    private static Mock<IHttpContextAccessor> CreateHttpContextMock(string userId = UserId)
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        var mock = new Mock<IHttpContextAccessor>();
        mock.Setup(x => x.HttpContext).Returns(context);
        return mock;
    }

    private static Mock<IStoryBehaviorEvaluator> CreateNoOpEvaluator()
    {
        var mock = new Mock<IStoryBehaviorEvaluator>();
        mock.Setup(e => e.SelectNextNodeAsync(It.IsAny<PlayerBehaviorContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((int?)null);
        return mock;
    }

    private static Mock<IBadgeAwardService> CreateNopBadgeService()
    {
        var mock = new Mock<IBadgeAwardService>();
        mock.Setup(s => s.AwardEligibleBadgesAsync(
                It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        return mock;
    }

    /// <summary>Seeds the minimum graph: Category → Story → StoryDetail → Node1 → Answer → Node2.</summary>
    private static async Task<(
        Core.Entities.Category category,
        Core.Entities.Story story,
        StoryDetail detail,
        StoryNode node1,
        StoryNodeAnswer answer,
        StoryNode node2,
        UserStoryProgress progress
    )> SeedBasicGraphAsync(
        ApplicationDbContext db,
        int? maxScoreTypeId = null,
        int? maxScoreValue = null,
        int? maxQuestionLimit = null,
        Dictionary<string, int>? answerScoreDeltas = null,
        string? answerFeedback = null,
        string? answerFeedbackVi = null,
        Dictionary<string, int>? branchWeights = null,
        int? nextNodeId = null)
    {
        // SQLite enforces FK: UserId → AspNetUsers — seed the user first
        var user = new ApplicationUser { Id = UserId, UserName = UserId, NormalizedUserName = UserId, Email = $"{UserId}@test.com", NormalizedEmail = $"{UserId}@test.com".ToUpperInvariant(), SecurityStamp = Guid.NewGuid().ToString() };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var category = new Core.Entities.Category
        {
            Title = "Investment", IsActive = true, ScoreWeight = 1m, OrderToShow = 1,
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var story = new Core.Entities.Story
        {
            Title = "Test Story", CategoryId = category.Id, IsPublish = true,
            Status = StoryStatus.Published, StoryType = "Interactive",
            AuthorId = null, // null = skip contributed-point block (InMemory doesn't support ExecuteUpdateAsync)
            MaxScoreTypeId = maxScoreTypeId, MaxScoreValue = maxScoreValue,
            MaxQuestionLimit = maxQuestionLimit,
        };
        db.Stories.Add(story);
        await db.SaveChangesAsync();

        var detail = new StoryDetail
        {
            StoryId = story.Id, Revision = 1,
        };
        db.StoryDetails.Add(detail);
        await db.SaveChangesAsync();

        var node1 = new StoryNode
        {
            StoryDetailId = detail.Id, Question = "Q1", IsStart = true, SortOrder = 1,
        };
        var node2 = new StoryNode
        {
            StoryDetailId = detail.Id, Question = "Q2", IsStart = false, SortOrder = 2,
        };
        db.StoryNodes.AddRange(node1, node2);
        await db.SaveChangesAsync();

        var answer = new StoryNodeAnswer
        {
            StoryNodeId  = node1.Id,
            Text         = "Answer A",
            PointsAwarded = 10,
            ScoreDeltas  = answerScoreDeltas ?? new Dictionary<string, int>(),
            Feedback     = answerFeedback,
            FeedbackVi   = answerFeedbackVi,
            BranchWeights = branchWeights ?? new Dictionary<string, int>(),
            NextNodeId   = nextNodeId ?? node2.Id,
        };
        db.StoryNodeAnswers.Add(answer);
        await db.SaveChangesAsync();

        var progress = new UserStoryProgress
        {
            UserId = UserId, StoryId = story.Id, StoryDetailId = detail.Id,
            CurrentNodeId = node1.Id, IsCompleted = false, ScoreTotals = new Dictionary<string, int>(),
        };
        db.UserStoryProgresses.Add(progress);
        await db.SaveChangesAsync();

        return (category, story, detail, node1, answer, node2, progress);
    }

    // ── Tests ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WhenAnswerHasScoreDeltas_UpdatesScoreTotals()
    {
        // Arrange
        using var tdb = CreateDb(); var db = tdb.Db;
        var deltas = new Dictionary<string, int> { ["capital"] = 5, ["experience"] = 3 };
        var (_, _, _, _, answer, _, progress) = await SeedBasicGraphAsync(db, answerScoreDeltas: deltas);

        var handler = new SubmitStoryAnswerHandler(
            db, CreateHttpContextMock().Object,
            CreateNoOpEvaluator().Object, CreateNopBadgeService().Object,
            NullLogger<SubmitStoryAnswerHandler>.Instance);

        // Act
        var result = await handler.Handle(
            new Core.Commands.Story.SubmitStoryAnswerCommand(progress.Id, answer.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.ScoreTotals["capital"].Should().Be(5);
        result.Value.ScoreTotals["experience"].Should().Be(3);
    }

    [Fact]
    public async Task Handle_WhenAnswerHasScoreDeltas_SnapshotsDeltasOnUserAnswer()
    {
        // Arrange
        using var tdb = CreateDb(); var db = tdb.Db;
        var deltas = new Dictionary<string, int> { ["capital"] = 7 };
        var (_, _, _, _, answer, _, progress) = await SeedBasicGraphAsync(db, answerScoreDeltas: deltas);

        var handler = new SubmitStoryAnswerHandler(
            db, CreateHttpContextMock().Object,
            CreateNoOpEvaluator().Object, CreateNopBadgeService().Object,
            NullLogger<SubmitStoryAnswerHandler>.Instance);

        // Act
        await handler.Handle(
            new Core.Commands.Story.SubmitStoryAnswerCommand(progress.Id, answer.Id), CancellationToken.None);

        // Assert
        var userAnswer = await db.UserStoryAnswers.FirstAsync();
        userAnswer.ScoreDeltas.Should().ContainKey("capital").WhoseValue.Should().Be(7);
    }

    [Fact]
    public async Task Handle_WhenMaxScoreValueReached_CompletesStory()
    {
        // Arrange
        using var tdb = CreateDb(); var db = tdb.Db;

        var deltas = new Dictionary<string, int> { ["capital"] = 100 };
        var (category, story, _, _, answer, _, progress) = await SeedBasicGraphAsync(
            db,
            answerScoreDeltas: deltas,
            maxScoreValue: 50);

        // Add the score type after the category exists (SQLite FK constraint)
        var scoreType = new CategoryScoreType
        {
            Name = "capital", ScoreWeight = 1m, OrderToShow = 1, CategoryId = category.Id,
        };
        db.CategoryScoreTypes.Add(scoreType);
        await db.SaveChangesAsync();

        // Link score type to story now that scoreType.Id is set
        story.MaxScoreTypeId = scoreType.Id;
        await db.SaveChangesAsync();

        var handler = new SubmitStoryAnswerHandler(
            db, CreateHttpContextMock().Object,
            CreateNoOpEvaluator().Object, CreateNopBadgeService().Object,
            NullLogger<SubmitStoryAnswerHandler>.Instance);

        // Act
        var result = await handler.Handle(
            new Core.Commands.Story.SubmitStoryAnswerCommand(progress.Id, answer.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenMaxQuestionLimitReached_CompletesStory()
    {
        // Arrange
        using var tdb = CreateDb(); var db = tdb.Db;
        var (_, _, _, _, answer, _, progress) = await SeedBasicGraphAsync(
            db, maxQuestionLimit: 1);

        var handler = new SubmitStoryAnswerHandler(
            db, CreateHttpContextMock().Object,
            CreateNoOpEvaluator().Object, CreateNopBadgeService().Object,
            NullLogger<SubmitStoryAnswerHandler>.Instance);

        // Act
        var result = await handler.Handle(
            new Core.Commands.Story.SubmitStoryAnswerCommand(progress.Id, answer.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenBranchWeightsEmpty_UsesNextNodeId()
    {
        // Arrange
        using var tdb = CreateDb(); var db = tdb.Db;
        var (_, _, _, _, answer, node2, progress) = await SeedBasicGraphAsync(db);

        var handler = new SubmitStoryAnswerHandler(
            db, CreateHttpContextMock().Object,
            CreateNoOpEvaluator().Object, CreateNopBadgeService().Object,
            NullLogger<SubmitStoryAnswerHandler>.Instance);

        // Act
        var result = await handler.Handle(
            new Core.Commands.Story.SubmitStoryAnswerCommand(progress.Id, answer.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsCompleted.Should().BeFalse();
        result.Value.CurrentNode!.Id.Should().Be(node2.Id);
    }

    [Fact]
    public async Task Handle_WhenBranchWeightsPopulated_ResolvesToOneOfBranches()
    {
        // Arrange
        using var tdb = CreateDb(); var db = tdb.Db;

        // We need a third node to branch to
        var (_, _, detail, node1, _, node2, progress) = await SeedBasicGraphAsync(db);

        var node3 = new StoryNode { StoryDetailId = detail.Id, Question = "Q3", SortOrder = 3 };
        db.StoryNodes.Add(node3);
        await db.SaveChangesAsync();

        // Replace the seeded answer with one that has branch weights
        var branchAnswer = new StoryNodeAnswer
        {
            StoryNodeId  = node1.Id,
            Text         = "Branch Answer",
            BranchWeights = new Dictionary<string, int>
            {
                [node2.Id.ToString()] = 50,
                [node3.Id.ToString()] = 50,
            },
            NextNodeId = null,
        };
        db.StoryNodeAnswers.Add(branchAnswer);
        await db.SaveChangesAsync();

        var handler = new SubmitStoryAnswerHandler(
            db, CreateHttpContextMock().Object,
            CreateNoOpEvaluator().Object, CreateNopBadgeService().Object,
            NullLogger<SubmitStoryAnswerHandler>.Instance);

        // Act — run multiple times to ensure the resolved node is always one of the branches
        var resolvedNodeIds = new HashSet<int>();
        for (var i = 0; i < 20; i++)
        {
            // Reset progress state each iteration
            progress.IsCompleted = false;
            progress.CurrentNodeId = node1.Id;
            await db.SaveChangesAsync();

            var result = await handler.Handle(
                new Core.Commands.Story.SubmitStoryAnswerCommand(progress.Id, branchAnswer.Id), CancellationToken.None);

            if (result.IsSuccess && result.Value!.CurrentNode is not null)
                resolvedNodeIds.Add(result.Value.CurrentNode.Id);

            // Remove the recorded answers to allow resubmission
            db.UserStoryAnswers.RemoveRange(db.UserStoryAnswers.Where(a => a.ProgressId == progress.Id));
            await db.SaveChangesAsync();
        }

        // Assert — resolved node must always be node2 or node3
        resolvedNodeIds.Should().OnlyContain(id => id == node2.Id || id == node3.Id);
    }

    [Fact]
    public async Task Handle_WhenAnswerHasFeedback_FeedbackReturnedInDto()
    {
        // Arrange
        using var tdb = CreateDb(); var db = tdb.Db;
        var (_, _, _, _, answer, _, progress) = await SeedBasicGraphAsync(
            db, answerFeedback: "Good choice!");

        var handler = new SubmitStoryAnswerHandler(
            db, CreateHttpContextMock().Object,
            CreateNoOpEvaluator().Object, CreateNopBadgeService().Object,
            NullLogger<SubmitStoryAnswerHandler>.Instance);

        // Act
        var result = await handler.Handle(
            new Core.Commands.Story.SubmitStoryAnswerCommand(progress.Id, answer.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.LastAnswerFeedback.Should().NotBeNull();
        result.Value.LastAnswerFeedback!.Feedback.Should().Be("Good choice!");
    }

    [Fact]
    public async Task Handle_WhenStoryCompletes_AwardsCreditTransaction()
    {
        // Arrange
        using var tdb = CreateDb(); var db = tdb.Db;
        // Answer with NextNodeId = null → end of story
        var (_, _, _, _, answer, _, progress) = await SeedBasicGraphAsync(db, nextNodeId: null);

        // Override: set nextNodeId to null explicitly
        var endAnswer = await db.StoryNodeAnswers.FirstAsync(a => a.Id == answer.Id);
        endAnswer.NextNodeId = null;
        await db.SaveChangesAsync();

        var handler = new SubmitStoryAnswerHandler(
            db, CreateHttpContextMock().Object,
            CreateNoOpEvaluator().Object, CreateNopBadgeService().Object,
            NullLogger<SubmitStoryAnswerHandler>.Instance);

        // Act
        var result = await handler.Handle(
            new Core.Commands.Story.SubmitStoryAnswerCommand(progress.Id, endAnswer.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsCompleted.Should().BeTrue();

        var credit = await db.CreditTransactions.FirstOrDefaultAsync(t => t.UserId == UserId);
        credit.Should().NotBeNull();
        credit!.Type.Should().Be("StoryComplete");
    }

    [Fact]
    public async Task Handle_WhenAnswerHasFeedbackVi_FeedbackViReturnedInDto()
    {
        // Arrange
        using var tdb = CreateDb(); var db = tdb.Db;
        var (_, _, _, _, answer, _, progress) = await SeedBasicGraphAsync(
            db, answerFeedback: "Good choice!", answerFeedbackVi: "Lựa chọn tốt!");

        var handler = new SubmitStoryAnswerHandler(
            db, CreateHttpContextMock().Object,
            CreateNoOpEvaluator().Object, CreateNopBadgeService().Object,
            NullLogger<SubmitStoryAnswerHandler>.Instance);

        // Act
        var result = await handler.Handle(
            new Core.Commands.Story.SubmitStoryAnswerCommand(progress.Id, answer.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.LastAnswerFeedback.Should().NotBeNull();
        result.Value.LastAnswerFeedback!.FeedbackVi.Should().Be("Lựa chọn tốt!");
    }

    [Fact]
    public async Task Handle_WhenProgressNotFound_ReturnsNotFound()
    {
        // Arrange
        using var tdb = CreateDb(); var db = tdb.Db;
        var (_, _, _, _, answer, _, _) = await SeedBasicGraphAsync(db);

        var handler = new SubmitStoryAnswerHandler(
            db, CreateHttpContextMock().Object,
            CreateNoOpEvaluator().Object, CreateNopBadgeService().Object,
            NullLogger<SubmitStoryAnswerHandler>.Instance);

        // Act
        var result = await handler.Handle(
            new Core.Commands.Story.SubmitStoryAnswerCommand(99999, answer.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task Handle_WhenAnswerNotFound_ReturnsNotFound()
    {
        // Arrange
        using var tdb = CreateDb(); var db = tdb.Db;
        var (_, _, _, _, _, _, progress) = await SeedBasicGraphAsync(db);

        var handler = new SubmitStoryAnswerHandler(
            db, CreateHttpContextMock().Object,
            CreateNoOpEvaluator().Object, CreateNopBadgeService().Object,
            NullLogger<SubmitStoryAnswerHandler>.Instance);

        // Act
        var result = await handler.Handle(
            new Core.Commands.Story.SubmitStoryAnswerCommand(progress.Id, 99999), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
    }
}
