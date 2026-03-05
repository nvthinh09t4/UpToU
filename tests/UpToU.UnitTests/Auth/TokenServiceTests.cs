using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Options;
using UpToU.Infrastructure.Services;

namespace UpToU.UnitTests.Auth;

public class TokenServiceTests
{
    private static TokenService CreateService(ApplicationDbContext db)
    {
        var jwtOptions = Options.Create(new JwtOptions
        {
            SecretKey = "dGVzdC1zZWNyZXQta2V5LWZvci11bml0LXRlc3RzLW1pbi0zMi1jaGFycw==",
            Issuer = "UpToU.API",
            Audience = "UpToU.Client",
            AccessTokenExpiryMinutes = 15,
            RefreshTokenExpiryDays = 7
        });

        return new TokenService(jwtOptions, db);
    }

    private static ApplicationDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public void GenerateAccessToken_WhenCalled_ReturnsNonEmptyString()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var sut = CreateService(db);
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = "test@example.com",
            UserName = "test@example.com",
            FirstName = "Test",
            LastName = "User"
        };
        var roles = new List<string> { "User" };

        // Act
        var token = sut.GenerateAccessToken(user, roles);

        // Assert
        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void GenerateRefreshToken_WhenCalled_ReturnsActiveToken()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var sut = CreateService(db);
        var userId = Guid.NewGuid().ToString();

        // Act
        var refreshToken = sut.GenerateRefreshToken(userId);

        // Assert
        refreshToken.Should().NotBeNull();
        refreshToken.UserId.Should().Be(userId);
        refreshToken.IsActive.Should().BeTrue();
        refreshToken.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task ValidateRefreshTokenAsync_WithActiveToken_ReturnsUserId()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var sut = CreateService(db);
        var userId = Guid.NewGuid().ToString();
        var refreshToken = new RefreshToken
        {
            Token = "valid-token-string",
            UserId = userId,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync();

        // Act
        var result = await sut.ValidateRefreshTokenAsync("valid-token-string", CancellationToken.None);

        // Assert
        result.Should().Be(userId);
    }

    [Fact]
    public async Task ValidateRefreshTokenAsync_WithExpiredToken_ReturnsNull()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var sut = CreateService(db);
        var refreshToken = new RefreshToken
        {
            Token = "expired-token",
            UserId = Guid.NewGuid().ToString(),
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-8)
        };
        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync();

        // Act
        var result = await sut.ValidateRefreshTokenAsync("expired-token", CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task ValidateRefreshTokenAsync_WithRevokedToken_ReturnsNull()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var sut = CreateService(db);
        var refreshToken = new RefreshToken
        {
            Token = "revoked-token",
            UserId = Guid.NewGuid().ToString(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            RevokedAt = DateTime.UtcNow.AddMinutes(-5)
        };
        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync();

        // Act
        var result = await sut.ValidateRefreshTokenAsync("revoked-token", CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task ValidateRefreshTokenAsync_WithNonExistentToken_ReturnsNull()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var sut = CreateService(db);

        // Act
        var result = await sut.ValidateRefreshTokenAsync("does-not-exist", CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }
}
