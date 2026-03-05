using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Seed;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ApplicationDbContext db)
    {
        await SeedRolesAndAdminAsync(userManager, roleManager);
        await SeedCategoriesAsync(db);
    }

    private static async Task SeedRolesAndAdminAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        string[] roles = ["Admin", "User"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        const string adminEmail = "admin@uptou.local";
        const string adminPassword = "Admin@12345!";

        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FirstName = "System",
                LastName = "Admin",
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(admin, adminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
                await userManager.AddToRoleAsync(admin, "User");
            }
        }
    }

    private static async Task SeedCategoriesAsync(ApplicationDbContext db)
    {
        if (await db.Categories.IgnoreQueryFilters().AnyAsync())
            return;

        var now = DateTime.UtcNow;
        const string seededBy = "system";

        var roots = new List<Category>
        {
            new()
            {
                Title = "Finance",
                Description = "Money management, budgeting, and financial planning topics.",
                IsActive = true, ScoreWeight = 1.5m, OrderToShow = 1,
                CreatedOn = now, CreatedBy = seededBy,
                Children = new List<Category>
                {
                    new() { Title = "Investment", Description = "Stocks, bonds, crypto, and long-term wealth building.", IsActive = true, ScoreWeight = 1.4m, OrderToShow = 1, CreatedOn = now, CreatedBy = seededBy },
                    new() { Title = "Budgeting", Description = "Personal budgeting frameworks and saving strategies.", IsActive = true, ScoreWeight = 1.2m, OrderToShow = 2, CreatedOn = now, CreatedBy = seededBy },
                    new() { Title = "Tax & Accounting", Description = "Tax planning, deductions, and accounting basics.", IsActive = true, ScoreWeight = 1.0m, OrderToShow = 3, CreatedOn = now, CreatedBy = seededBy },
                }
            },
            new()
            {
                Title = "Real Life",
                Description = "Everyday challenges, relationships, and practical life advice.",
                IsActive = true, ScoreWeight = 1.3m, OrderToShow = 2,
                CreatedOn = now, CreatedBy = seededBy,
                Children = new List<Category>
                {
                    new() { Title = "Health & Wellness", Description = "Physical health, mental wellness, and fitness.", IsActive = true, ScoreWeight = 1.3m, OrderToShow = 1, CreatedOn = now, CreatedBy = seededBy },
                    new() { Title = "Career", Description = "Job hunting, workplace dynamics, and career growth.", IsActive = true, ScoreWeight = 1.2m, OrderToShow = 2, CreatedOn = now, CreatedBy = seededBy },
                    new() { Title = "Relationships", Description = "Family, friendships, and social connections.", IsActive = true, ScoreWeight = 1.1m, OrderToShow = 3, CreatedOn = now, CreatedBy = seededBy },
                }
            },
            new()
            {
                Title = "Fiction",
                Description = "Creative storytelling, imaginative worlds, and fictional narratives.",
                IsActive = true, ScoreWeight = 1.0m, OrderToShow = 3,
                CreatedOn = now, CreatedBy = seededBy,
                Children = new List<Category>
                {
                    new() { Title = "Fantasy", Description = "Magic, mythical creatures, and epic world-building.", IsActive = true, ScoreWeight = 1.0m, OrderToShow = 1, CreatedOn = now, CreatedBy = seededBy },
                    new() { Title = "Sci-Fi", Description = "Futuristic technology, space exploration, and speculative worlds.", IsActive = true, ScoreWeight = 1.0m, OrderToShow = 2, CreatedOn = now, CreatedBy = seededBy },
                    new() { Title = "Thriller", Description = "Suspense-driven stories with high stakes and twists.", IsActive = true, ScoreWeight = 0.9m, OrderToShow = 3, CreatedOn = now, CreatedBy = seededBy },
                }
            },
            new()
            {
                Title = "Technology",
                Description = "Software, hardware, AI, and the digital world.",
                IsActive = true, ScoreWeight = 1.4m, OrderToShow = 4,
                CreatedOn = now, CreatedBy = seededBy,
                Children = new List<Category>
                {
                    new() { Title = "Programming", Description = "Coding, software engineering, and dev best practices.", IsActive = true, ScoreWeight = 1.4m, OrderToShow = 1, CreatedOn = now, CreatedBy = seededBy },
                    new() { Title = "AI & Machine Learning", Description = "Artificial intelligence, LLMs, and data science.", IsActive = true, ScoreWeight = 1.5m, OrderToShow = 2, CreatedOn = now, CreatedBy = seededBy },
                    new() { Title = "Gadgets", Description = "Consumer electronics, reviews, and tech news.", IsActive = true, ScoreWeight = 0.9m, OrderToShow = 3, CreatedOn = now, CreatedBy = seededBy },
                }
            },
            new()
            {
                Title = "Self Improvement",
                Description = "Habits, mindset, productivity, and personal growth.",
                IsActive = true, ScoreWeight = 1.3m, OrderToShow = 5,
                CreatedOn = now, CreatedBy = seededBy,
                Children = new List<Category>
                {
                    new() { Title = "Productivity", Description = "Time management, systems, and focus strategies.", IsActive = true, ScoreWeight = 1.3m, OrderToShow = 1, CreatedOn = now, CreatedBy = seededBy },
                    new() { Title = "Mindset", Description = "Growth mindset, resilience, and mental frameworks.", IsActive = true, ScoreWeight = 1.2m, OrderToShow = 2, CreatedOn = now, CreatedBy = seededBy },
                }
            },
        };

        db.Categories.AddRange(roots);
        await db.SaveChangesAsync();
    }
}
