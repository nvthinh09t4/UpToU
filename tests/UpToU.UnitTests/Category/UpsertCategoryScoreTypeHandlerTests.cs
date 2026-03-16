using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Category;

namespace UpToU.UnitTests.CategoryTests;

public class UpsertCategoryScoreTypeHandlerTests
{
    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static async Task<Core.Entities.Category> SeedCategoryAsync(ApplicationDbContext db)
    {
        var category = new Core.Entities.Category
        {
            Title = "Investment", IsActive = true, ScoreWeight = 1m, OrderToShow = 1,
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category;
    }

    [Theory]
    [InlineData("Capital")]           // starts with uppercase
    [InlineData("1capital")]          // starts with digit
    [InlineData("has space")]         // contains space
    [InlineData("has-dash")]          // contains dash
    [InlineData("")]                  // empty
    public async Task Handle_WhenNameIsInvalid_ReturnsFailure(string invalidName)
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = await SeedCategoryAsync(db);
        var handler = new UpsertCategoryScoreTypeHandler(db);
        var command = new UpsertCategoryScoreTypeCommand(null, category.Id, invalidName, null, 1m, 0);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Name must start");
    }

    [Fact]
    public async Task Handle_WhenNameIsValid_CreatesScoreType()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = await SeedCategoryAsync(db);
        var handler = new UpsertCategoryScoreTypeHandler(db);
        var command = new UpsertCategoryScoreTypeCommand(null, category.Id, "capital", "Capital", 2m, 1);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Name.Should().Be("capital");
        result.Value.Label.Should().Be("Capital");
        result.Value.ScoreWeight.Should().Be(2m);
    }

    [Fact]
    public async Task Handle_WhenDuplicateNameInSameCategory_ReturnsFailure()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = await SeedCategoryAsync(db);
        db.CategoryScoreTypes.Add(new CategoryScoreType
        {
            CategoryId = category.Id, Name = "capital", ScoreWeight = 1m, OrderToShow = 0,
        });
        await db.SaveChangesAsync();

        var handler = new UpsertCategoryScoreTypeHandler(db);
        var command = new UpsertCategoryScoreTypeCommand(null, category.Id, "capital", null, 1m, 0);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("already exists");
    }

    [Fact]
    public async Task Handle_WhenCategoryNotFound_ReturnsNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var handler = new UpsertCategoryScoreTypeHandler(db);
        var command = new UpsertCategoryScoreTypeCommand(null, 999, "capital", null, 1m, 0);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task Handle_WhenUpdatingExistingScoreType_UpdatesFields()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var category = await SeedCategoryAsync(db);
        var existing = new CategoryScoreType
        {
            CategoryId = category.Id, Name = "capital", Label = "Old", ScoreWeight = 1m, OrderToShow = 0,
        };
        db.CategoryScoreTypes.Add(existing);
        await db.SaveChangesAsync();

        var handler = new UpsertCategoryScoreTypeHandler(db);
        var command = new UpsertCategoryScoreTypeCommand(existing.Id, category.Id, "capital", "New Label", 3m, 5);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Label.Should().Be("New Label");
        result.Value.ScoreWeight.Should().Be(3m);
        result.Value.OrderToShow.Should().Be(5);
    }
}
