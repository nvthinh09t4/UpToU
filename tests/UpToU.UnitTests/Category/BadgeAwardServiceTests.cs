using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Services;

namespace UpToU.UnitTests.CategoryTests;

public class BadgeAwardServiceTests
{
    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static async Task<(Core.Entities.Category category, List<CategoryBadge> badges)>
        SeedCategoryWithBadgesAsync(ApplicationDbContext db)
    {
        var category = new Core.Entities.Category
        {
            Title = "Investment", IsActive = true, ScoreWeight = 1m, OrderToShow = 1,
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var tier1 = new CategoryBadge { CategoryId = category.Id, Tier = 1, Label = "Apprentice",    ScoreThreshold = 10 };
        var tier2 = new CategoryBadge { CategoryId = category.Id, Tier = 2, Label = "Practitioner",  ScoreThreshold = 30 };
        var tier3 = new CategoryBadge { CategoryId = category.Id, Tier = 3, Label = "Expert",        ScoreThreshold = 60 };
        db.CategoryBadges.AddRange(tier1, tier2, tier3);
        await db.SaveChangesAsync();

        return (category, new List<CategoryBadge> { tier1, tier2, tier3 });
    }

    [Fact]
    public async Task AwardEligibleBadgesAsync_WhenScoreBelowAllThresholds_AwardsNoBadges()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (category, _) = await SeedCategoryWithBadgesAsync(db);
        var service = new BadgeAwardService(db, NullLogger<BadgeAwardService>.Instance);

        // Act
        await service.AwardEligibleBadgesAsync("user-1", category.Id, categoryScore: 5, CancellationToken.None);
        await db.SaveChangesAsync();

        // Assert
        var awarded = await db.UserCategoryBadges.CountAsync();
        awarded.Should().Be(0);
    }

    [Fact]
    public async Task AwardEligibleBadgesAsync_WhenScoreAboveTier1Only_AwardsTier1Badge()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (category, badges) = await SeedCategoryWithBadgesAsync(db);
        var service = new BadgeAwardService(db, NullLogger<BadgeAwardService>.Instance);

        // Act
        await service.AwardEligibleBadgesAsync("user-1", category.Id, categoryScore: 15, CancellationToken.None);
        await db.SaveChangesAsync();

        // Assert
        var awarded = await db.UserCategoryBadges.ToListAsync();
        awarded.Should().HaveCount(1);
        awarded[0].BadgeId.Should().Be(badges[0].Id); // tier 1
    }

    [Fact]
    public async Task AwardEligibleBadgesAsync_WhenScoreAboveMultipleThresholds_AwardsAllEligibleBadges()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (category, badges) = await SeedCategoryWithBadgesAsync(db);
        var service = new BadgeAwardService(db, NullLogger<BadgeAwardService>.Instance);

        // Act
        await service.AwardEligibleBadgesAsync("user-1", category.Id, categoryScore: 50, CancellationToken.None);
        await db.SaveChangesAsync();

        // Assert
        var awarded = await db.UserCategoryBadges.Select(ub => ub.BadgeId).ToListAsync();
        awarded.Should().HaveCount(2);
        awarded.Should().Contain(badges[0].Id); // tier 1
        awarded.Should().Contain(badges[1].Id); // tier 2
    }

    [Fact]
    public async Task AwardEligibleBadgesAsync_WhenBadgeAlreadyHeld_DoesNotCreateDuplicate()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var (category, badges) = await SeedCategoryWithBadgesAsync(db);
        db.UserCategoryBadges.Add(new UserCategoryBadge
        {
            UserId = "user-1", BadgeId = badges[0].Id, AwardedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new BadgeAwardService(db, NullLogger<BadgeAwardService>.Instance);

        // Act
        await service.AwardEligibleBadgesAsync("user-1", category.Id, categoryScore: 15, CancellationToken.None);
        await db.SaveChangesAsync();

        // Assert
        var awarded = await db.UserCategoryBadges.CountAsync();
        awarded.Should().Be(1); // no duplicate
    }
}
