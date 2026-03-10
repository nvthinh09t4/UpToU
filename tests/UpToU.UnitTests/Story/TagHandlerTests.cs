using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Story;

namespace UpToU.UnitTests.Story;

public class TagHandlerTests
{
    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    // ── CreateTagHandler ─────────────────────────────────────────────────────

    [Fact]
    public async Task CreateTag_WhenTagAlreadyExists_ReturnsConflict()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        db.Tags.Add(new Tag { Name = "dotnet" });
        await db.SaveChangesAsync();

        var handler = new CreateTagHandler(db);

        // Act
        var result = await handler.Handle(new CreateTagCommand("dotnet"), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(409);
        result.Error.Should().Contain("dotnet");
    }

    [Fact]
    public async Task CreateTag_WhenNew_CreatesAndReturnsTag()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = new CreateTagHandler(db);

        // Act
        var result = await handler.Handle(new CreateTagCommand("react"), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Name.Should().Be("react");
        result.Value.Id.Should().BeGreaterThan(0);

        var saved = await db.Tags.SingleAsync();
        saved.Name.Should().Be("react");
    }

    [Fact]
    public async Task CreateTag_WhenMultipleTagsExist_OnlyAddsOne()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        db.Tags.AddRange(new Tag { Name = "a" }, new Tag { Name = "b" });
        await db.SaveChangesAsync();

        var handler = new CreateTagHandler(db);

        // Act
        await handler.Handle(new CreateTagCommand("c"), CancellationToken.None);

        // Assert
        var count = await db.Tags.CountAsync();
        count.Should().Be(3);
    }

    // ── DeleteTagHandler ─────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteTag_WhenTagNotFound_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = new DeleteTagHandler(db);

        // Act
        var result = await handler.Handle(new DeleteTagCommand(999), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("Tag not found");
    }

    [Fact]
    public async Task DeleteTag_WhenValid_RemovesTagFromDatabase()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var tag = new Tag { Name = "to-delete" };
        db.Tags.Add(tag);
        await db.SaveChangesAsync();

        var handler = new DeleteTagHandler(db);

        // Act
        var result = await handler.Handle(new DeleteTagCommand(tag.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeTrue();

        var remaining = await db.Tags.ToListAsync();
        remaining.Should().BeEmpty();
    }

    // ── GetTagsHandler ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetTags_WhenNoTags_ReturnsEmptyList()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = new GetTagsHandler(db);

        // Act
        var result = await handler.Handle(new GetTagsQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task GetTags_ReturnsAllTagsOrderedAlphabetically()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        db.Tags.AddRange(
            new Tag { Name = "zebra" },
            new Tag { Name = "apple" },
            new Tag { Name = "mango" }
        );
        await db.SaveChangesAsync();

        var handler = new GetTagsHandler(db);

        // Act
        var result = await handler.Handle(new GetTagsQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(3);
        result.Value!.Select(t => t.Name).Should().BeInAscendingOrder();
        result.Value.First().Name.Should().Be("apple");
        result.Value.Last().Name.Should().Be("zebra");
    }
}
