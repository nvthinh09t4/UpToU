using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using UpToU.Core.Interfaces;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Options;

namespace UpToU.IntegrationTests.Infrastructure;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    // Shared signing key — must match between TokenService and JWT Bearer middleware.
    public static readonly byte[] TestSigningKey =
        Convert.FromBase64String("dGVzdC1zZWNyZXQta2V5LWZvci11cHRvdS1pbnRlZ3JhdGlvbi10ZXN0cw==");

    public const string TestIssuer = "UpToU-Test";
    public const string TestAudience = "UpToU-Test";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // ── Replace DbContext: bypass EF Core's options pipeline entirely ──
            // Removing just DbContextOptions<T> is not enough in EF Core 8
            // because IDbContextOptionsConfiguration<T> still holds the SQL Server config.
            // We directly register ApplicationDbContext with pre-built InMemory options.
            var dbName = "TestDb_" + Guid.NewGuid();
            var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

            // Remove all existing ApplicationDbContext and options registrations
            services.RemoveAll<ApplicationDbContext>();
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.RemoveAll<DbContextOptions>();

            // Remove IDbContextOptionsConfiguration<ApplicationDbContext> by type name
            // (internal EF Core type — must be found via reflection)
            var efConfigsToRemove = services
                .Where(d => d.ServiceType.IsGenericType
                         && d.ServiceType.GetGenericArguments().Length == 1
                         && d.ServiceType.GetGenericArguments()[0] == typeof(ApplicationDbContext)
                         && d.ServiceType.Name.StartsWith("IDbContextOptionsConfiguration"))
                .ToList();
            foreach (var d in efConfigsToRemove)
                services.Remove(d);

            // Register the DbContext and options directly
            services.AddScoped<ApplicationDbContext>(_ => new ApplicationDbContext(dbOptions));
            services.AddScoped<DbContextOptions<ApplicationDbContext>>(_ => dbOptions);
            services.AddScoped<DbContextOptions>(_ => dbOptions);

            // ── Override IOptions<JwtOptions> so TokenService uses the test key ─
            var jwtConfigDescriptors = services
                .Where(d => d.ServiceType == typeof(IConfigureOptions<JwtOptions>)
                         || d.ServiceType == typeof(IOptions<JwtOptions>))
                .ToList();
            foreach (var d in jwtConfigDescriptors)
                services.Remove(d);

            services.AddSingleton<IOptions<JwtOptions>>(new OptionsWrapper<JwtOptions>(new JwtOptions
            {
                SecretKey = Convert.ToBase64String(TestSigningKey),
                Issuer = TestIssuer,
                Audience = TestAudience,
                AccessTokenExpiryMinutes = 15,
                RefreshTokenExpiryDays = 7
            }));

            // ── Override JWT Bearer validation to use the same test key ────────
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = TestIssuer,
                    ValidAudience = TestAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(TestSigningKey),
                    ClockSkew = TimeSpan.Zero
                };
            });

            // ── Replace EmailService with no-op ───────────────────────────────
            services.RemoveAll<IEmailService>();
            services.AddScoped<IEmailService, NoOpEmailService>();
        });

        builder.UseEnvironment("Testing");
    }
}

/// <summary>No-op email service for integration tests.</summary>
file sealed class NoOpEmailService : IEmailService
{
    public Task SendEmailConfirmationAsync(string email, string confirmationLink, CancellationToken ct)
        => Task.CompletedTask;

    public Task SendPasswordResetAsync(string email, string resetLink, CancellationToken ct)
        => Task.CompletedTask;
}
