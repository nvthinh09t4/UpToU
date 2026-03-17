using System.Threading.RateLimiting;
using FluentValidation;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using UpToU.API.Middleware;
using UpToU.API.Options;
using UpToU.Core.Entities;
using UpToU.Infrastructure;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Jobs;
using UpToU.Infrastructure.Options;
using UpToU.Infrastructure.Seed;

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ───────────────────────────────────────────────────────────────────
builder.Host.UseSerilog((ctx, config) =>
    config.ReadFrom.Configuration(ctx.Configuration));

// ── Infrastructure (Identity, DbContext, Services, MediatR) ──────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// ── Hangfire ──────────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(connectionString, new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout    = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval          = TimeSpan.Zero,
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks           = true,
    }));

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = 2;
    options.ServerName  = "UpToU-BgWorker";
});

// ── FluentValidation ─────────────────────────────────────────────────────────
builder.Services.AddValidatorsFromAssembly(
    typeof(UpToU.Core.Validators.RegisterCommandValidator).Assembly);

// ── Authentication ────────────────────────────────────────────────────────────
var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
var secretKey = jwtSection.GetValue<string>("SecretKey")!;
var issuer = jwtSection.GetValue<string>("Issuer")!;
var audience = jwtSection.GetValue<string>("Audience")!;

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(secretKey)),
            ClockSkew = TimeSpan.Zero
        };
    })
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
    })
    .AddFacebook(options =>
    {
        options.AppId = builder.Configuration["Authentication:Facebook:AppId"]!;
        options.AppSecret = builder.Configuration["Authentication:Facebook:AppSecret"]!;
    });

// ── Authorization ─────────────────────────────────────────────────────────────
builder.Services.AddAuthorizationBuilder()
    // Admin-only operations: role/ban/reward management (no story approval)
    .AddPolicy("AdminOnly",               p => p.RequireRole("Admin"))
    // Story approval/rejection: Supervisor + Senior Supervisor (NOT Admin)
    .AddPolicy("StaffOnly",               p => p.RequireRole("Supervisor", "Senior Supervisor"))
    // Role assignment: Admin + Senior Supervisor
    .AddPolicy("SeniorSupervisorOrAdmin", p => p.RequireRole("Admin", "Senior Supervisor"))
    // Story CRUD + dashboard: all CRM staff
    .AddPolicy("StaffOrAdmin",            p => p.RequireRole("Admin", "Supervisor", "Senior Supervisor"))
    // Story submission + management: all CRM roles
    .AddPolicy("ContributorOrAbove",      p => p.RequireRole("Admin", "Supervisor", "Senior Supervisor", "Contributor"));

// ── Options (API-specific) ────────────────────────────────────────────────────
builder.Services.Configure<ClientOptions>(
    builder.Configuration.GetSection(ClientOptions.SectionName));

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
    options.AddPolicy("FrontendPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // Allow any localhost port so Vite port-shifting doesn't break CORS
            policy.SetIsOriginAllowed(origin =>
                      new Uri(origin).Host == "localhost")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            var clientBaseUrl = builder.Configuration["Client:BaseUrl"]!;
            var crmBaseUrl = builder.Configuration["Client:CrmBaseUrl"]!;
            policy.WithOrigins(clientBaseUrl, crmBaseUrl)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    }));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
    options.AddFixedWindowLimiter("AuthPolicy", cfg =>
    {
        cfg.PermitLimit = builder.Configuration.GetValue("RateLimiting:AuthPolicy:PermitLimit", 10);
        cfg.Window = TimeSpan.FromSeconds(builder.Configuration.GetValue("RateLimiting:AuthPolicy:WindowSeconds", 60));
        cfg.QueueLimit = 0;
        cfg.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    }));

// ── Controllers + Swagger ─────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // ── One Swagger document per logical tab ──────────────────────────────────
    options.SwaggerDoc("auth",          new() { Title = "🔐 Auth",              Version = "v1", Description = "Authentication, registration, token refresh, social login" });
    options.SwaggerDoc("stories",       new() { Title = "📖 Stories",           Version = "v1", Description = "Articles, interactive stories, ratings & recommendations" });
    options.SwaggerDoc("categories",    new() { Title = "🗂 Categories",        Version = "v1", Description = "Category management, score types & badges" });
    options.SwaggerDoc("users",         new() { Title = "👤 Users",             Version = "v1", Description = "User profiles, credits & reading progress" });
    options.SwaggerDoc("social",        new() { Title = "💬 Social",            Version = "v1", Description = "Reactions, comments, votes, bookmarks & leaderboard" });
    options.SwaggerDoc("notifications", new() { Title = "🔔 Notifications",     Version = "v1", Description = "User notification feed" });
    options.SwaggerDoc("admin",         new() { Title = "⚙ Admin",             Version = "v1", Description = "Admin panel, reports & background jobs" });

    // ── Route each controller to its document ─────────────────────────────────
    options.DocInclusionPredicate((docName, api) =>
    {
        api.ActionDescriptor.RouteValues.TryGetValue("controller", out var ctrl);
        ctrl ??= "";
        return docName switch
        {
            "auth"          => ctrl == "Auth",
            "stories"       => ctrl is "Story" or "InteractiveStory",
            "categories"    => ctrl == "Category",
            "users"         => ctrl is "User" or "Credit" or "Progress",
            "social"        => ctrl is "Reaction" or "Comment" or "Leaderboard",
            "notifications" => ctrl == "Notification",
            "admin"         => ctrl is "Admin" or "Reports" or "Jobs",
            _               => false,
        };
    });

    // ── Security (shared across all docs) ─────────────────────────────────────
    options.AddSecurityDefinition("Bearer", new()
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Paste your JWT access token (use the token bar at the top of the page)",
    });
    options.AddSecurityRequirement(new()
    {
        [new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } }] = []
    });
});

var app = builder.Build();

// ── Run migrations + seed on startup ─────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    if (db.Database.IsRelational())
        await db.Database.MigrateAsync();
    else
        await db.Database.EnsureCreatedAsync();
    await DatabaseSeeder.SeedAsync(userManager, roleManager, db);
}

// ── Register recurring jobs ───────────────────────────────────────────────────
// Must use the DI-based IRecurringJobManager (not the static RecurringJob API)
// because JobStorage.Current is only initialised after app.Build().
var recurringJobs = app.Services.GetRequiredService<IRecurringJobManager>();

recurringJobs.AddOrUpdate<CleanupNotificationsJob>(
    "cleanup-notifications",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Daily(2));  // 02:00 UTC daily

recurringJobs.AddOrUpdate<ExpiredBanCleanupJob>(
    "expired-ban-cleanup",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Hourly());  // every hour

recurringJobs.AddOrUpdate<ClearExpiredDisplayNamesJob>(
    "clear-expired-display-names",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Daily(3));  // 03:00 UTC daily

recurringJobs.AddOrUpdate<PublishApprovedStoriesJob>(
    "publish-approved-stories",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Minutely());  // check every minute for scheduled publishes

recurringJobs.AddOrUpdate<AssignContributorTitleJob>(
    "assign-contributor-title",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Daily(4));  // 04:00 UTC daily — crown the current Contributor Champion

// ── Middleware pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.UseStaticFiles();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        // ── One tab per document ──────────────────────────────────────────────
        c.SwaggerEndpoint("/swagger/auth/swagger.json",          "🔐 Auth");
        c.SwaggerEndpoint("/swagger/stories/swagger.json",       "📖 Stories");
        c.SwaggerEndpoint("/swagger/categories/swagger.json",    "🗂 Categories");
        c.SwaggerEndpoint("/swagger/users/swagger.json",         "👤 Users");
        c.SwaggerEndpoint("/swagger/social/swagger.json",        "💬 Social");
        c.SwaggerEndpoint("/swagger/notifications/swagger.json", "🔔 Notifications");
        c.SwaggerEndpoint("/swagger/admin/swagger.json",         "⚙ Admin");

        // ── UX: always in execute mode, token persists across refreshes ───────
        c.EnableTryItOutByDefault();
        c.DisplayRequestDuration();
        c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.None);
        c.DefaultModelExpandDepth(-1);
        c.EnableFilter();
        c.DocumentTitle = "UpToU API";

        // ── Inject custom token bar + tab styles ──────────────────────────────
        c.InjectStylesheet("/swagger-ui/custom.css");
        c.InjectJavascript("/swagger-ui/custom.js");
    });
}

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program { }
