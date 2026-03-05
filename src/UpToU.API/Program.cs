using System.Threading.RateLimiting;
using FluentValidation;
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
using UpToU.Infrastructure.Options;
using UpToU.Infrastructure.Seed;

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ───────────────────────────────────────────────────────────────────
builder.Host.UseSerilog((ctx, config) =>
    config.ReadFrom.Configuration(ctx.Configuration));

// ── Infrastructure (Identity, DbContext, Services, MediatR) ──────────────────
builder.Services.AddInfrastructure(builder.Configuration);

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
builder.Services.AddAuthorization(options =>
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin")));

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
        cfg.PermitLimit = 10;
        cfg.Window = TimeSpan.FromMinutes(1);
        cfg.QueueLimit = 0;
        cfg.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    }));

// ── Controllers + Swagger ─────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "UpToU API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new()
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter your JWT access token"
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

// ── Middleware pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program { }
