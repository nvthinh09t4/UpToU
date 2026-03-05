using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using UpToU.Core.Commands.Auth;
using UpToU.Core.DTOs;
using UpToU.IntegrationTests.Infrastructure;

namespace UpToU.IntegrationTests.Auth;

public class AuthEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthEndpointsTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_WithValidData_Returns201()
    {
        // Arrange
        var command = new RegisterCommand("Test", "User", "testuser@example.com", "Password@1");

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_Returns409()
    {
        // Arrange
        var command = new RegisterCommand("Test", "User", "duplicate@example.com", "Password@1");
        await _client.PostAsJsonAsync("/api/v1/auth/register", command);

        // Act — register again with same email
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", command);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_WithUnconfirmedEmail_Returns403()
    {
        // Arrange
        var email = "unconfirmed@example.com";
        await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterCommand("Test", "User", email, "Password@1"));

        var loginCommand = new LoginCommand(email, "Password@1");

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginCommand);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_Returns401()
    {
        // Arrange
        var loginCommand = new LoginCommand("nobody@example.com", "WrongPassword@1");

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginCommand);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_WithoutToken_Returns401()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_WithValidToken_Returns200()
    {
        // Arrange — use the seeded admin account
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginCommand("admin@uptou.local", "Admin@12345!"));

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        auth.Should().NotBeNull();

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        // Act
        var meResponse = await _client.GetAsync("/api/v1/auth/me");

        // Assert
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var user = await meResponse.Content.ReadFromJsonAsync<UserDto>();
        user!.Email.Should().Be("admin@uptou.local");
    }
}
