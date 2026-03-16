using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using UpToU.Core.AI;
using UpToU.Core.Entities;
using UpToU.Core.Interfaces;
using UpToU.Infrastructure.AI;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Options;
using UpToU.Infrastructure.Services;

namespace UpToU.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));
        services.Configure<DatabaseOptions>(o =>
            o.ConnectionString = configuration.GetConnectionString("DefaultConnection") ?? string.Empty);
        services.AddSingleton<IDbConnectionFactory, SqlConnectionFactory>();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly("UpToU.Infrastructure")));

        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 8;
            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedEmail = true;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IBadgeAwardService, BadgeAwardService>();
        services.AddScoped<IStoryBehaviorEvaluator, NoOpStoryBehaviorEvaluator>();

        services.AddHttpContextAccessor();

        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        return services;
    }
}
