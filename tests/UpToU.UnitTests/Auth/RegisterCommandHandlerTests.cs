using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using UpToU.Core.Commands.Auth;
using UpToU.Core.Entities;
using UpToU.Core.Interfaces;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Handlers.Auth;

namespace UpToU.UnitTests.Auth;

public class RegisterCommandHandlerTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<ILogger<RegisterCommandHandler>> _loggerMock;
    private readonly ApplicationDbContext _db;

    public RegisterCommandHandlerTests()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _emailServiceMock = new Mock<IEmailService>();

        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Scheme = "https";
        httpContext.Request.Host = new HostString("localhost", 5000);
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);

        _loggerMock = new Mock<ILogger<RegisterCommandHandler>>();

        var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ApplicationDbContext(dbOptions);
    }

    private RegisterCommandHandler CreateHandler() =>
        new(_userManagerMock.Object, _emailServiceMock.Object, _httpContextAccessorMock.Object, _loggerMock.Object, _db);

    [Fact]
    public async Task Handle_WhenEmailAlreadyExists_ReturnsConflict()
    {
        // Arrange
        var command = new RegisterCommand("John", "Doe", "existing@example.com", "Password@1");
        _userManagerMock
            .Setup(x => x.FindByEmailAsync(command.Email))
            .ReturnsAsync(new ApplicationUser { Email = command.Email });

        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task Handle_WhenCreateFails_ReturnsFailure()
    {
        // Arrange
        var command = new RegisterCommand("John", "Doe", "new@example.com", "weakpassword");
        _userManagerMock
            .Setup(x => x.FindByEmailAsync(command.Email))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock
            .Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), command.Password))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Password too weak." }));

        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Error.Should().Contain("Password too weak.");
    }

    [Fact]
    public async Task Handle_WhenSuccess_SendsConfirmationEmail()
    {
        // Arrange
        var command = new RegisterCommand("Jane", "Doe", "jane@example.com", "Password@1");
        _userManagerMock
            .Setup(x => x.FindByEmailAsync(command.Email))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock
            .Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), command.Password))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock
            .Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock
            .Setup(x => x.GenerateEmailConfirmationTokenAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync("confirmation-token");

        _userManagerMock
            .Setup(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(new List<string> { "User" });

        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _emailServiceMock.Verify(
            x => x.SendEmailConfirmationAsync(
                "jane@example.com",
                It.Is<string>(link => link.Contains("confirm-email")),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
