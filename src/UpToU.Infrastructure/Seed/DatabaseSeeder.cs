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
        var categories = await SeedCategoriesAsync(db);
        await SeedCategoryScoreTypesAsync(db, categories);
        await SeedTagsAndStoriesAsync(db, categories);
        await SeedInteractiveStoriesAsync(db, categories);
        await InvestmentCrisisStorySeeder.SeedAsync(db, categories);
        await SeedExclusiveRewardsAsync(db);
    }

    private static async Task SeedExclusiveRewardsAsync(ApplicationDbContext db)
    {
        const string championValue = "✍️ Contributor Champion";

        // Idempotent — only seed once
        if (await db.RewardItems.AnyAsync(r => r.IsExclusive && r.Value == championValue))
            return;

        db.RewardItems.Add(new RewardItem
        {
            Name        = "Contributor Champion",
            Description = "Awarded daily to the author whose stories have been finished by the most unique readers. "
                        + "This title cannot be purchased — it belongs to the community's most impactful storyteller.",
            Category    = "Title",
            CreditCost  = 0,
            Value       = championValue,
            IsActive    = true,
            IsExclusive = true,
            CreatedAt   = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();
    }

    private static async Task SeedRolesAndAdminAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        string[] roles = ["Admin", "User", "Supervisor", "Senior Supervisor", "Contributor"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        const string adminEmail = "admin@uptou.local";
        const string adminPassword = "Admin@12345!";

        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin is null)
        {
            admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FirstName = "System",
                LastName = "Admin",
                MentionHandle = "system.admin",
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(admin, adminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
                await userManager.AddToRoleAsync(admin, "User");
            }
        }
        else if (admin.MentionHandle is null)
        {
            admin.MentionHandle = "system.admin";
            await userManager.UpdateAsync(admin);
        }

        const string adminTestEmail = "admintest@uptou.local";
        const string adminTestPassword = "123456aA@";

        var adminTest = await userManager.FindByEmailAsync(adminTestEmail);
        if (adminTest is null)
        {
            adminTest = new ApplicationUser
            {
                UserName = adminTestEmail,
                Email = adminTestEmail,
                EmailConfirmed = true,
                FirstName = "Admin",
                LastName = "Test",
                MentionHandle = "admin.test",
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(adminTest, adminTestPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminTest, "Admin");
                await userManager.AddToRoleAsync(adminTest, "User");
            }
        }
        else if (adminTest.MentionHandle is null)
        {
            adminTest.MentionHandle = "admin.test";
            await userManager.UpdateAsync(adminTest);
        }

        const string userEmail = "user01@uptou.local";
        const string userPassword = "123456aA@";

        var user = await userManager.FindByEmailAsync(userEmail);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = userEmail,
                Email = userEmail,
                EmailConfirmed = true,
                FirstName = "User",
                LastName = "01",
                MentionHandle = "user.01",
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(user, userPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(user, "User");
        }
        else if (user.MentionHandle is null)
        {
            user.MentionHandle = "user.01";
            await userManager.UpdateAsync(user);
        }

        // ── Senior Supervisor seed user ───────────────────────────────────────
        const string seniorSupEmail = "seniorsuper@uptou.local";
        const string seedPassword   = "123456aA@";

        var seniorSup = await userManager.FindByEmailAsync(seniorSupEmail);
        if (seniorSup is null)
        {
            seniorSup = new ApplicationUser
            {
                UserName     = seniorSupEmail,
                Email        = seniorSupEmail,
                EmailConfirmed = true,
                FirstName    = "Sarah",
                LastName     = "Chen",
                MentionHandle = "sarah.chen",
                CreatedAt    = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(seniorSup, seedPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(seniorSup, "Senior Supervisor");
                await userManager.AddToRoleAsync(seniorSup, "User");
            }
        }
        else if (seniorSup.MentionHandle is null)
        {
            seniorSup.MentionHandle = "sarah.chen";
            await userManager.UpdateAsync(seniorSup);
        }

        // ── Supervisor seed users ─────────────────────────────────────────────
        foreach (var (email, firstName, lastName, handle) in new[]
        {
            ("supervisor1@uptou.local", "James",   "Park",   "james.park"),
            ("supervisor2@uptou.local", "Amelia",  "Torres", "amelia.torres"),
        })
        {
            var sup = await userManager.FindByEmailAsync(email);
            if (sup is null)
            {
                sup = new ApplicationUser
                {
                    UserName      = email,
                    Email         = email,
                    EmailConfirmed = true,
                    FirstName     = firstName,
                    LastName      = lastName,
                    MentionHandle = handle,
                    CreatedAt     = DateTime.UtcNow
                };
                var result = await userManager.CreateAsync(sup, seedPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(sup, "Supervisor");
                    await userManager.AddToRoleAsync(sup, "User");
                }
            }
            else if (sup.MentionHandle is null)
            {
                sup.MentionHandle = handle;
                await userManager.UpdateAsync(sup);
            }
        }

        // ── Contributor seed users ────────────────────────────────────────────
        foreach (var (email, firstName, lastName, handle) in new[]
        {
            ("contributor1@uptou.local", "Leo",    "Nguyen", "leo.nguyen"),
            ("contributor2@uptou.local", "Priya",  "Sharma", "priya.sharma"),
            ("contributor3@uptou.local", "Marcus", "Hill",   "marcus.hill"),
        })
        {
            var contrib = await userManager.FindByEmailAsync(email);
            if (contrib is null)
            {
                contrib = new ApplicationUser
                {
                    UserName      = email,
                    Email         = email,
                    EmailConfirmed = true,
                    FirstName     = firstName,
                    LastName      = lastName,
                    MentionHandle = handle,
                    CreatedAt     = DateTime.UtcNow
                };
                var result = await userManager.CreateAsync(contrib, seedPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(contrib, "Contributor");
                    await userManager.AddToRoleAsync(contrib, "User");
                }
            }
            else if (contrib.MentionHandle is null)
            {
                contrib.MentionHandle = handle;
                await userManager.UpdateAsync(contrib);
            }
        }

        // ── Pending users (registered on client, no CRM role assigned yet) ────
        foreach (var (email, firstName, lastName, handle) in new[]
        {
            ("pending1@uptou.local", "Chris",  "Evans",   "chris.evans"),
            ("pending2@uptou.local", "Fatima", "Al-Said", "fatima.alsaid"),
        })
        {
            var pending = await userManager.FindByEmailAsync(email);
            if (pending is null)
            {
                pending = new ApplicationUser
                {
                    UserName      = email,
                    Email         = email,
                    EmailConfirmed = true,
                    FirstName     = firstName,
                    LastName      = lastName,
                    MentionHandle = handle,
                    CreatedAt     = DateTime.UtcNow
                };
                var result = await userManager.CreateAsync(pending, seedPassword);
                if (result.Succeeded)
                    await userManager.AddToRoleAsync(pending, "User");
            }
            else if (pending.MentionHandle is null)
            {
                pending.MentionHandle = handle;
                await userManager.UpdateAsync(pending);
            }
        }
    }

    private static async Task<List<Category>> SeedCategoriesAsync(ApplicationDbContext db)
    {
        if (await db.Categories.IgnoreQueryFilters().AnyAsync())
            return await db.Categories.IgnoreQueryFilters().ToListAsync();

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

        return await db.Categories.IgnoreQueryFilters().ToListAsync();
    }

    private static async Task SeedCategoryScoreTypesAsync(ApplicationDbContext db, List<Category> categories)
    {
        // Map score types by category title — each entry is (name, label, weight, order)
        // This method is upsert-safe: runs on every startup and adds/updates/removes score types as needed.
        var scoreTypeMap = new Dictionary<string, List<(string Name, string Label, decimal Weight, int Order)>>
        {
            ["Investment"] =
            [
                ("capital",    "Capital",    0.35m, 1),
                ("experience", "Experience", 0.30m, 2),
                ("mental",     "Mental",     0.20m, 3),
                ("health",     "Health",     0.15m, 4),
            ],
            ["Budgeting"] =
            [
                ("discipline", "Discipline", 0.40m, 1),
                ("knowledge",  "Knowledge",  0.35m, 2),
                ("habits",     "Habits",     0.25m, 3),
            ],
            ["Tax & Accounting"] =
            [
                ("knowledge",   "Knowledge",   0.50m, 1),
                ("compliance",  "Compliance",  0.30m, 2),
                ("efficiency",  "Efficiency",  0.20m, 3),
            ],
            ["Health & Wellness"] =
            [
                ("physical",  "Physical",  0.35m, 1),
                ("mental",    "Mental",    0.35m, 2),
                ("nutrition", "Nutrition", 0.30m, 3),
            ],
            ["Career"] =
            [
                ("skills",       "Skills",       0.35m, 1),
                ("network",      "Network",      0.25m, 2),
                ("mindset",      "Mindset",      0.25m, 3),
                ("experience",   "Experience",   0.15m, 4),
            ],
            ["Relationships"] =
            [
                ("empathy",       "Empathy",       0.40m, 1),
                ("communication", "Communication", 0.35m, 2),
                ("trust",         "Trust",         0.25m, 3),
            ],
            ["Productivity"] =
            [
                ("focus",      "Focus",      0.40m, 1),
                ("systems",    "Systems",    0.35m, 2),
                ("energy",     "Energy",     0.25m, 3),
            ],
            ["Mindset"] =
            [
                ("resilience", "Resilience", 0.40m, 1),
                ("growth",     "Growth",     0.35m, 2),
                ("clarity",    "Clarity",    0.25m, 3),
            ],
            ["Programming"] =
            [
                ("technical",  "Technical",  0.45m, 1),
                ("logic",      "Logic",      0.30m, 2),
                ("creativity", "Creativity", 0.25m, 3),
            ],
            ["AI & Machine Learning"] =
            [
                ("technical",    "Technical",    0.40m, 1),
                ("data_insight", "Data Insight", 0.35m, 2),
                ("ethics",       "Ethics",       0.25m, 3),
            ],
            ["Fantasy"] =
            [
                ("imagination", "Imagination", 0.50m, 1),
                ("lore",        "Lore",        0.30m, 2),
                ("emotion",     "Emotion",     0.20m, 3),
            ],
            ["Sci-Fi"] =
            [
                ("logic",       "Logic",       0.40m, 1),
                ("imagination", "Imagination", 0.35m, 2),
                ("ethics",      "Ethics",      0.25m, 3),
            ],
            ["Thriller"] =
            [
                ("tension",   "Tension",   0.45m, 1),
                ("logic",     "Logic",     0.30m, 2),
                ("emotion",   "Emotion",   0.25m, 3),
            ],
            ["Real Life"] =
            [
                ("research",      "Research",       0.35m, 1),
                ("patience",      "Patience",       0.30m, 2),
                ("budget_sense",  "Budget Sense",   0.35m, 3),
            ],
        };

        var existing = await db.CategoryScoreTypes
            .ToDictionaryAsync(st => (st.CategoryId, st.Name));

        foreach (var category in categories)
        {
            if (!scoreTypeMap.TryGetValue(category.Title, out var expected))
                continue;

            var expectedNames = expected.Select(e => e.Name).ToHashSet();

            // Remove score types no longer in the map
            var toRemove = existing.Values
                .Where(st => st.CategoryId == category.Id && !expectedNames.Contains(st.Name))
                .ToList();
            if (toRemove.Count > 0)
                db.CategoryScoreTypes.RemoveRange(toRemove);

            // Insert or update
            foreach (var (name, label, weight, order) in expected)
            {
                if (existing.TryGetValue((category.Id, name), out var existingSt))
                {
                    existingSt.Label       = label;
                    existingSt.ScoreWeight = weight;
                    existingSt.OrderToShow = order;
                }
                else
                {
                    db.CategoryScoreTypes.Add(new CategoryScoreType
                    {
                        CategoryId  = category.Id,
                        Name        = name,
                        Label       = label,
                        ScoreWeight = weight,
                        OrderToShow = order,
                    });
                }
            }
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedTagsAndStoriesAsync(ApplicationDbContext db, List<Category> categories)
    {
        if (await db.Stories.IgnoreQueryFilters().AnyAsync())
            return;

        var now = DateTime.UtcNow;
        const string seededBy = "system";

        // ── Tags ─────────────────────────────────────────────────────────────
        var tagNames = new[]
        {
            "beginner", "advanced", "guide", "tips", "analysis",
            "investing", "savings", "productivity", "mindset", "health",
            "coding", "ai", "career", "fiction", "sci-fi"
        };

        var tags = tagNames.Select(n => new Tag { Name = n }).ToList();
        db.Tags.AddRange(tags);
        await db.SaveChangesAsync();

        Tag GetTag(string name) => tags.First(t => t.Name == name);
        Category GetCat(string title) => categories.First(c => c.Title == title);

        // ── Stories ──────────────────────────────────────────────────────────
        var stories = new List<Story>
        {
            new()
            {
                Title = "Index Funds vs. Active Management: What the Data Says",
                Slug = "index-funds-vs-active-management",
                Excerpt = "Decades of data show index funds consistently outperform actively managed funds after fees. Here's the evidence you need to make the right call.",
                Description = "A deep dive into decades of market data comparing passive index investing against actively managed funds. We examine return distributions, fee drag, and survivorship bias.",
                CoverImageUrl = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
                AuthorName = "Alex Morgan",
                IsFeatured = true,
                CategoryId = GetCat("Investment").Id,
                PublishDate = now.AddDays(-10),
                IsPublish = true,
                CreatedOn = now.AddDays(-11),
                CreatedBy = seededBy,
                Tags = new List<Tag> { GetTag("investing"), GetTag("analysis"), GetTag("advanced") },
                StoryDetails = new List<StoryDetail>
                {
                    new()
                    {
                        Revision = 1, IsPublish = true,
                        SavePath = "stories/finance/index-funds-vs-active.md",
                        Content = "## The Core Question\n\nEvery investor eventually faces it: should I pick actively managed funds that promise to beat the market, or simply buy the market itself with an index fund?\n\n## What 40 Years of Data Shows\n\nStudies covering 40 years of mutual fund performance tell a remarkably consistent story. Over any 15-year period, **80–90% of actively managed large-cap funds underperform their benchmark index**.\n\nThe reasons are structural:\n- **Fees**: Active funds charge 0.5%–1.5% annually. Index funds charge 0.03%–0.20%.\n- **Turnover costs**: Frequent trading generates tax drag and transaction costs.\n- **Survivorship bias**: Poor-performing funds close, making the average look better than it is.\n\n## The Fee Math\n\nConsider $100,000 invested over 30 years at 8% annual return:\n\n| Fund Type | Annual Fee | Final Value |\n|-----------|-----------|-------------|\n| Index Fund | 0.05% | **$993,000** |\n| Active Fund | 1.00% | **$761,000** |\n\nThat 0.95% difference costs you **$232,000** — more than twice your original investment.\n\n## When Active Management Can Win\n\nActive funds have an edge in:\n- **Small-cap and emerging markets** (less efficient, more opportunity)\n- **Niche sectors** where specialist knowledge matters\n- **Bear markets** with defensive mandates\n\n## The Verdict\n\nFor the core of your portfolio, low-cost index funds win on evidence. Use active funds selectively, only when you understand exactly why they might outperform and at what cost.",
                        WordCount = 240, ScoreWeight = 1.4m,
                        CreatedOn = now.AddDays(-11), CreatedBy = seededBy
                    }
                }
            },
            new()
            {
                Title = "Getting Started with ETFs: A Beginner's Roadmap",
                Slug = "getting-started-with-etfs",
                Excerpt = "ETFs combine the diversification of mutual funds with the flexibility of stocks. This guide walks you through everything you need to build your first ETF portfolio.",
                Description = "Everything you need to know about exchange-traded funds — how they work, how to choose them, and how to build a simple portfolio.",
                CoverImageUrl = "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1200&q=80",
                AuthorName = "Sara Chen",
                CategoryId = GetCat("Investment").Id,
                PublishDate = now.AddDays(-5),
                IsPublish = true,
                CreatedOn = now.AddDays(-6),
                CreatedBy = seededBy,
                Tags = new List<Tag> { GetTag("investing"), GetTag("beginner"), GetTag("guide") },
                StoryDetails = new List<StoryDetail>
                {
                    new()
                    {
                        Revision = 1, IsPublish = true,
                        SavePath = "stories/finance/etf-beginners-roadmap.md",
                        Content = "## What Is an ETF?\n\nAn **Exchange-Traded Fund (ETF)** is a basket of securities — stocks, bonds, or commodities — that trades on a stock exchange like a single share. You get instant diversification without buying each asset individually.\n\n## Why ETFs Beat Most Alternatives\n\n- **Low cost**: Expense ratios often below 0.10%\n- **Tax efficient**: Lower capital gains distributions than mutual funds\n- **Transparent**: Holdings are published daily\n- **Flexible**: Buy or sell any time markets are open\n\n## The 3-ETF Portfolio\n\nFor most beginners, three ETFs cover everything:\n\n1. **US Total Market** (e.g., VTI) — 60%\n2. **International Developed Markets** (e.g., VXUS) — 30%\n3. **US Bond Aggregate** (e.g., BND) — 10%\n\nAdjust the bond allocation based on your age and risk tolerance.\n\n## What to Look for When Choosing an ETF\n\n- **Expense Ratio**: Lower is better. Aim for under 0.20%.\n- **AUM**: Funds with >$1B in assets have better liquidity.\n- **Tracking Error**: How closely does it follow its index?\n- **Bid-Ask Spread**: Tight spreads mean lower trading costs.\n\n## Getting Started\n\n1. Open a brokerage account (Fidelity, Vanguard, or Schwab are solid choices)\n2. Fund it with an amount you're comfortable investing for 5+ years\n3. Buy your chosen ETFs on any trading day\n4. Set up automatic contributions and rebalance once a year",
                        WordCount = 220, ScoreWeight = 1.2m,
                        CreatedOn = now.AddDays(-6), CreatedBy = seededBy
                    }
                }
            },
            new()
            {
                Title = "The 50/30/20 Rule: Does It Still Work in 2026?",
                Slug = "50-30-20-rule-2026",
                Excerpt = "The classic budgeting framework was built for a different economy. We test it against today's housing costs and inflation — and suggest smarter adaptations.",
                Description = "A practical look at the classic budget rule in the context of today's inflation and housing costs, with adaptations for different income levels.",
                CoverImageUrl = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
                AuthorName = "Jordan Lee",
                CategoryId = GetCat("Budgeting").Id,
                PublishDate = now.AddDays(-3),
                IsPublish = true,
                CreatedOn = now.AddDays(-4),
                CreatedBy = seededBy,
                Tags = new List<Tag> { GetTag("savings"), GetTag("guide"), GetTag("tips") },
                StoryDetails = new List<StoryDetail>
                {
                    new()
                    {
                        Revision = 1, IsPublish = true,
                        SavePath = "stories/finance/50-30-20-rule-2026.md",
                        Content = "## The Original Rule\n\nElizabeth Warren popularized the **50/30/20 rule** in her book *All Your Worth*:\n\n- **50%** of after-tax income → Needs (housing, food, utilities, transport)\n- **30%** → Wants (dining out, entertainment, subscriptions)\n- **20%** → Savings and debt repayment\n\n## Why It's Harder Today\n\nIn many cities, housing alone consumes 35–45% of take-home pay. The \"50% for needs\" bucket is already blown before groceries.\n\n**Average rent as % of median income by city (2026):**\n- New York: 48%\n- San Francisco: 52%\n- Austin: 38%\n- Chicago: 32%\n\n## Adapted Frameworks\n\n### The 60/20/20 Adjustment\nIf you live in a high cost-of-living area, allow 60% for needs and trim wants to 20%. Don't touch the 20% savings.\n\n### The Reverse Budget\nPay yourself first — automate savings on payday, then spend what's left freely. Many find this less stressful than tracking categories.\n\n### The Priority Stack\n1. Emergency fund (3–6 months expenses)\n2. Employer 401k match (free money — always capture this)\n3. High-interest debt\n4. Additional investing\n5. Everything else\n\n## Bottom Line\n\nThe 50/30/20 rule is a starting point, not a rigid law. The real goal: spend less than you earn and invest the difference consistently. How you get there is up to you.",
                        WordCount = 230, ScoreWeight = 1.2m,
                        CreatedOn = now.AddDays(-4), CreatedBy = seededBy
                    }
                }
            },
            new()
            {
                Title = "Clean Architecture in .NET 8: A Practical Guide",
                Slug = "clean-architecture-dotnet8",
                Excerpt = "Clean Architecture keeps your business logic independent of frameworks, databases, and UI. Here's how to apply it in a real ASP.NET Core 8 project.",
                Description = "Step-by-step walkthrough of implementing Clean Architecture in an ASP.NET Core 8 project, covering domain, application, infrastructure, and presentation layers.",
                CoverImageUrl = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80",
                AuthorName = "Dev Team",
                IsFeatured = true,
                CategoryId = GetCat("Programming").Id,
                PublishDate = now.AddDays(-7),
                IsPublish = true,
                CreatedOn = now.AddDays(-8),
                CreatedBy = seededBy,
                Tags = new List<Tag> { GetTag("coding"), GetTag("guide"), GetTag("advanced") },
                StoryDetails = new List<StoryDetail>
                {
                    new()
                    {
                        Revision = 1, IsPublish = false,
                        SavePath = "stories/tech/clean-arch-dotnet8.md",
                        Content = "## Draft content — first revision",
                        WordCount = 5, ScoreWeight = 1.4m,
                        CreatedOn = now.AddDays(-8), CreatedBy = seededBy
                    },
                    new()
                    {
                        Revision = 2, IsPublish = true,
                        SavePath = "stories/tech/clean-arch-dotnet8-v2.md",
                        Content = "## The Four Layers\n\nClean Architecture organizes code into concentric rings:\n\n1. **Domain** (innermost) — Entities, value objects, domain events. Zero dependencies.\n2. **Application** — Use cases, commands, queries (MediatR). Depends only on Domain.\n3. **Infrastructure** — EF Core, HTTP clients, external services. Implements Application interfaces.\n4. **Presentation** — Controllers, minimal APIs. Depends on Application.\n\n> The dependency rule: **source code dependencies only point inward.**\n\n## Project Structure\n\n```\nMyApp.Domain          ← no NuGet dependencies\nMyApp.Application     ← MediatR, FluentValidation\nMyApp.Infrastructure  ← EF Core, Identity, external APIs\nMyApp.API             ← ASP.NET Core, Swagger\n```\n\n## Wiring It Up\n\n```csharp\n// Program.cs\nbuilder.Services.AddApplication();\nbuilder.Services.AddInfrastructure(builder.Configuration);\n```\n\nEach layer registers its own services via extension methods — the API project never references Infrastructure types directly.\n\n## Benefits You'll Actually Feel\n\n- **Testability**: Unit test use cases without spinning up a database\n- **Replaceability**: Swap EF Core for Dapper by changing one project\n- **Clarity**: New developers immediately know where code belongs\n- **Stability**: Domain logic never breaks because you upgraded a NuGet package",
                        WordCount = 210, ScoreWeight = 1.5m, ScoreWeightHistory = new List<decimal> { 1.4m },
                        ChangeNotes = "Expanded with code examples and project structure diagram.",
                        CreatedOn = now.AddDays(-2), CreatedBy = seededBy
                    }
                }
            },
            new()
            {
                Title = "React 19 Features Every Developer Should Know",
                Slug = "react-19-features",
                Excerpt = "React 19 ships the compiler, server actions, and a revamped asset loading system. Here's what changes in your daily workflow — with real examples.",
                Description = "Exploring the most impactful new features in React 19 — from the compiler to server actions — with practical examples you can use today.",
                CoverImageUrl = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80",
                AuthorName = "Dev Team",
                CategoryId = GetCat("Programming").Id,
                PublishDate = now.AddDays(-1),
                IsPublish = true,
                CreatedOn = now.AddDays(-2),
                CreatedBy = seededBy,
                Tags = new List<Tag> { GetTag("coding"), GetTag("tips") },
                StoryDetails = new List<StoryDetail>
                {
                    new()
                    {
                        Revision = 1, IsPublish = true,
                        SavePath = "stories/tech/react19-features.md",
                        Content = "## 1. The React Compiler\n\nThe biggest shift in React 19: the compiler automatically memoizes your components. No more manual `useMemo`, `useCallback`, or `React.memo` for performance.\n\n```jsx\n// Before React 19\nconst expensive = useMemo(() => compute(data), [data]);\n\n// React 19 — compiler handles it automatically\nconst expensive = compute(data);\n```\n\n## 2. Server Actions\n\nCall server-side functions directly from client components without writing API routes:\n\n```jsx\nasync function savePost(formData) {\n  'use server';\n  await db.posts.create({ title: formData.get('title') });\n}\n\nexport function PostForm() {\n  return <form action={savePost}><input name=\"title\" /><button>Save</button></form>;\n}\n```\n\n## 3. use() Hook\n\nThe new `use()` hook reads resources inline — including Promises and Context:\n\n```jsx\nfunction UserProfile({ userPromise }) {\n  const user = use(userPromise); // suspends until resolved\n  return <h1>{user.name}</h1>;\n}\n```\n\n## 4. Improved Error Handling\n\nReact 19 distinguishes between recoverable and unrecoverable errors, giving you finer control in error boundaries.\n\n## 5. Asset Loading\n\nStylesheets, scripts, and fonts load in parallel with rendering and are deduplicated automatically — no more manual link tags in `<head>`.",
                        WordCount = 200, ScoreWeight = 1.3m,
                        CreatedOn = now.AddDays(-2), CreatedBy = seededBy
                    }
                }
            },
            new()
            {
                Title = "How Large Language Models Actually Work",
                Slug = "how-llms-work",
                Excerpt = "Forget the magic. LLMs are statistical text predictors built on transformers. Understanding the mechanism helps you use them — and spot their limits.",
                Description = "A non-mathematical explanation of transformers, attention mechanisms, and the training process behind today's most powerful AI systems.",
                CoverImageUrl = "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80",
                AuthorName = "AI Research Team",
                IsFeatured = true,
                CategoryId = GetCat("AI & Machine Learning").Id,
                PublishDate = now.AddDays(-14),
                IsPublish = true,
                CreatedOn = now.AddDays(-15),
                CreatedBy = seededBy,
                Tags = new List<Tag> { GetTag("ai"), GetTag("beginner"), GetTag("analysis") },
                StoryDetails = new List<StoryDetail>
                {
                    new()
                    {
                        Revision = 1, IsPublish = true,
                        SavePath = "stories/tech/how-llms-work.md",
                        Content = "## The Core Idea: Next-Token Prediction\n\nAt its heart, an LLM does one thing: **predict the most likely next word (token) given all preceding words**. That's it. The apparent intelligence emerges from doing this at massive scale.\n\n## Tokens, Not Words\n\nModels don't see words — they see tokens. \"unbelievable\" might become [\"un\", \"believ\", \"able\"]. Most models have a vocabulary of 50,000–100,000 tokens.\n\n## The Transformer Architecture\n\nTransformers process the entire input sequence at once (unlike older RNNs which read left-to-right). The key mechanism is **self-attention**:\n\n- Each token \"looks at\" every other token to understand context\n- \"bank\" in \"river bank\" vs \"bank account\" gets different representations\n- Multiple attention heads capture different relationship types simultaneously\n\n## Training: Two Phases\n\n### Pre-training\nThe model reads hundreds of billions of tokens from the internet, books, and code — predicting the next token over and over. This builds world knowledge and language patterns.\n\n### Fine-tuning (RLHF)\nHuman raters score outputs. The model learns to generate responses humans prefer — this shapes tone, safety, and helpfulness.\n\n## Why LLMs Hallucinate\n\nThe model has no \"truth checker.\" It generates plausible-sounding continuations. When it lacks knowledge, it still generates *something* — often confidently wrong.\n\n## Key Takeaway\n\nLLMs are powerful pattern matchers, not reasoning engines. Use them for drafting, summarizing, and generating options — verify facts independently.",
                        WordCount = 260, ScoreWeight = 1.5m,
                        CreatedOn = now.AddDays(-15), CreatedBy = seededBy
                    }
                }
            },
            new()
            {
                Title = "Deep Work in the Age of Notifications",
                Slug = "deep-work-notifications",
                Excerpt = "Your attention is being sold to the highest bidder. Reclaiming it requires deliberate systems, not just willpower. Here's what actually works.",
                Description = "How to protect your focus in a world of constant interruptions — practical systems for doing your best cognitive work every day.",
                CoverImageUrl = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80",
                AuthorName = "Sam Rivera",
                CategoryId = GetCat("Productivity").Id,
                PublishDate = now.AddDays(-20),
                IsPublish = true,
                CreatedOn = now.AddDays(-21),
                CreatedBy = seededBy,
                Tags = new List<Tag> { GetTag("productivity"), GetTag("mindset"), GetTag("tips") },
                StoryDetails = new List<StoryDetail>
                {
                    new()
                    {
                        Revision = 1, IsPublish = true,
                        SavePath = "stories/self-improvement/deep-work-notifications.md",
                        Content = "## What Is Deep Work?\n\nCal Newport defines deep work as *professional activities performed in a state of distraction-free concentration that push your cognitive capabilities to their limit*.\n\nThe opposite — shallow work — is logistical, replicable, and what fills most people's days.\n\n## Why It's Getting Harder\n\nThe average knowledge worker checks email **74 times per day**. After each interruption, it takes **23 minutes** to fully regain focus (UC Irvine study). Do the math: if you're interrupted every 20 minutes, you never reach deep focus.\n\n## Systems That Work\n\n### 1. Time Blocking\nSchedule deep work as a non-negotiable appointment. Cal Newport blocks 9–11am daily. Treat it like a meeting you can't cancel.\n\n### 2. The Shutdown Ritual\nAt the end of each day, review open tasks, plan tomorrow, then say: \"Shutdown complete.\" This tells your brain work is done — reducing evening rumination.\n\n### 3. Batch Communication\nProcess email at 12pm and 5pm only. Respond to everything, then close the app. Asynchronous work is a feature, not a bug.\n\n### 4. Environmental Design\nWork in a location associated with focus. Phone in another room (not just silent). Browser tabs closed. Pomodoro timer set.\n\n### 5. The 4 Disciplines\n- Focus on the Wildly Important\n- Act on Lead Measures (hours of deep work, not outcomes)\n- Keep a Compelling Scoreboard\n- Create a Cadence of Accountability\n\n## Start Small\n\nBegin with one 90-minute deep work session per day. Protect it ruthlessly. Build from there.",
                        WordCount = 260, ScoreWeight = 1.3m,
                        CreatedOn = now.AddDays(-21), CreatedBy = seededBy
                    }
                }
            },
            new()
            {
                Title = "The Science Behind Growth Mindset (And How to Build One)",
                Slug = "growth-mindset-science",
                Excerpt = "Carol Dweck's research changed how we think about talent. But recent replications raise nuance. Here's what the evidence actually supports.",
                Description = "Carol Dweck's research made famous, but what does the latest neuroscience say? We explore actionable habits grounded in evidence.",
                CoverImageUrl = "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?w=1200&q=80",
                AuthorName = "Sam Rivera",
                CategoryId = GetCat("Mindset").Id,
                PublishDate = now.AddDays(-9),
                IsPublish = true,
                CreatedOn = now.AddDays(-10),
                CreatedBy = seededBy,
                Tags = new List<Tag> { GetTag("mindset"), GetTag("guide") },
                StoryDetails = new List<StoryDetail>
                {
                    new()
                    {
                        Revision = 1, IsPublish = true,
                        SavePath = "stories/self-improvement/growth-mindset-science.md",
                        Content = "## Fixed vs. Growth Mindset\n\nCarol Dweck's landmark research at Stanford identified two belief systems:\n\n- **Fixed mindset**: Intelligence and talent are static. Challenges threaten your identity.\n- **Growth mindset**: Abilities develop through effort and learning. Challenges are opportunities.\n\n## What the Research Shows\n\nDweck's studies found students with growth mindsets:\n- Chose harder problems\n- Recovered faster from failures\n- Achieved significantly better academic outcomes\n\nA 2022 meta-analysis of 43 studies confirmed moderate but consistent benefits, especially for students from lower socioeconomic backgrounds.\n\n## The Neuroscience\n\nWhen we learn something new, synaptic connections literally strengthen. The brain shows measurable changes after deliberate practice — a process called **neuroplasticity**. This is the biological foundation Dweck's theory describes.\n\n## Habits That Build a Growth Mindset\n\n### 1. Reframe \"I Can't\" → \"I Can't Yet\"\nThe word \"yet\" opens a door. It acknowledges where you are without closing off where you might go.\n\n### 2. Praise Process, Not Outcome\nWhen you succeed, note *what you did*, not who you are. \"That worked because I prepared\" vs. \"I'm just smart.\"\n\n### 3. Seek Feedback Actively\nPeople with growth mindsets want to know what's wrong — it's information, not judgment.\n\n### 4. Normalize Struggle\nDifficulty is a signal of learning, not incompetence. Elite performers expect struggle.\n\n## The Nuance\n\nGrowth mindset isn't a magic switch. It works best paired with deliberate practice, good teaching, and structural support — not as a replacement for them.",
                        WordCount = 270, ScoreWeight = 1.2m,
                        CreatedOn = now.AddDays(-10), CreatedBy = seededBy
                    }
                }
            },
            new()
            {
                Title = "Negotiating Your Salary: Scripts That Actually Work",
                Slug = "salary-negotiation-scripts",
                Excerpt = "Most people leave thousands on the table by accepting the first offer. These scripts and tactics give you the exact words to negotiate confidently.",
                Description = "Real conversation scripts and psychological tactics for negotiating a higher salary — whether for a new job or a raise at your current one.",
                CoverImageUrl = "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80",
                AuthorName = "Jordan Lee",
                CategoryId = GetCat("Career").Id,
                PublishDate = now.AddDays(-4),
                IsPublish = true,
                CreatedOn = now.AddDays(-5),
                CreatedBy = seededBy,
                Tags = new List<Tag> { GetTag("career"), GetTag("tips") },
                StoryDetails = new List<StoryDetail>
                {
                    new()
                    {
                        Revision = 1, IsPublish = true,
                        SavePath = "stories/real-life/salary-negotiation-scripts.md",
                        Content = "## Why Most People Don't Negotiate\n\nFear of rejection. Fear of seeming greedy. Fear of losing the offer. The data says these fears are overblown: **less than 10% of offers are rescinded after negotiation** (Jobvite research).\n\nMeanwhile, people who negotiate earn **$5,000–$10,000 more per year** on average — which compounds over a career into hundreds of thousands of dollars.\n\n## The Core Principle: Anchor High\n\nThe first number sets the negotiating range. Always let the employer name a figure first, then counter above your target.\n\n## Script: Responding to the Initial Offer\n\n> \"Thank you so much — I'm really excited about this role. Based on my research and experience, I was expecting something closer to **[X]**. Is there flexibility there?\"\n\nThen **stop talking**. Silence is powerful. Let them respond.\n\n## Script: When They Say \"That's Our Best Offer\"\n\n> \"I understand. Could we revisit in 90 days based on performance? And is there flexibility on [signing bonus / extra PTO / remote work]?\"\n\nAlways have a second ask ready.\n\n## Script: Asking for a Raise\n\n> \"I'd like to discuss my compensation. Over the past year I've [specific achievements with numbers]. Based on market data and my contributions, I'd like to target **[X]**. What would need to happen for that to be possible?\"\n\n## Preparation Checklist\n\n- Research market rates (Levels.fyi, Glassdoor, LinkedIn Salary, Blind)\n- Know your BATNA (Best Alternative To Negotiated Agreement)\n- Prepare 3 specific achievements with measurable impact\n- Decide your walk-away number before the conversation",
                        WordCount = 280, ScoreWeight = 1.2m,
                        CreatedOn = now.AddDays(-5), CreatedBy = seededBy
                    }
                }
            },
            new()
            {
                Title = "Sleep Optimization: The Evidence-Based Playbook",
                Slug = "sleep-optimization-playbook",
                Excerpt = "Chronic sleep deprivation is an epidemic — and most advice about fixing it is wrong. Here's what the science actually says about sleeping better.",
                Description = "What science actually says about improving sleep quality — from light exposure to temperature, chronotypes, and the risks of chronic deprivation.",
                CoverImageUrl = "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=1200&q=80",
                AuthorName = "Dr. Casey Wu",
                CategoryId = GetCat("Health & Wellness").Id,
                PublishDate = now.AddDays(-12),
                IsPublish = true,
                CreatedOn = now.AddDays(-13),
                CreatedBy = seededBy,
                Tags = new List<Tag> { GetTag("health"), GetTag("guide"), GetTag("analysis") },
                StoryDetails = new List<StoryDetail>
                {
                    new()
                    {
                        Revision = 1, IsPublish = true,
                        SavePath = "stories/real-life/sleep-optimization-playbook.md",
                        Content = "## The Cost of Bad Sleep\n\nAfter 17 hours awake, cognitive performance equals a **0.05% blood alcohol level**. After 24 hours, it's equivalent to legally drunk. Yet 35% of adults regularly sleep under 7 hours.\n\n## What Actually Moves the Needle\n\n### 1. Light is the Master Clock\nYour circadian rhythm is anchored by light exposure.\n- **Morning**: Get bright light within 30 minutes of waking. Outside is best; 10,000 lux lamp is fine.\n- **Evening**: Dim lights 2 hours before bed. Blue-light glasses or f.lux for screens.\n\n### 2. Temperature\nCore body temperature must drop ~1°C to initiate sleep. Set your room to **65–68°F (18–20°C)**. Cold shower 90 minutes before bed accelerates this.\n\n### 3. Consistency Beats Duration\nGoing to bed and waking at the same time every day — including weekends — is more impactful than trying to \"catch up\" on weekends. Weekend sleep shifts act like mini jet lag.\n\n### 4. Caffeine Has a Long Half-Life\nCaffeine's half-life is **5–7 hours**. A 3pm coffee still has 50% active caffeine at 9pm. Cut off at 2pm if you struggle to sleep.\n\n### 5. Alcohol Is a Sleep Disruptor\nAlcohol may help you fall asleep but fragments sleep architecture — suppressing REM and causing early waking. It's a net negative for sleep quality.\n\n## Your Sleep Hygiene Checklist\n\n- [ ] Fixed wake time (7 days/week)\n- [ ] Morning light within 30 min of waking\n- [ ] No caffeine after 2pm\n- [ ] Room at 65–68°F\n- [ ] No screens 30 min before bed (or blue-light glasses)\n- [ ] Wind-down routine: same cues each night\n\n## The One Thing\n\nIf you can only do one thing: **fix your wake time**. Everything else follows from a consistent anchor.",
                        WordCount = 300, ScoreWeight = 1.3m,
                        CreatedOn = now.AddDays(-13), CreatedBy = seededBy
                    }
                }
            },
            new()
            {
                Title = "The Last Upload",
                Slug = "the-last-upload",
                Excerpt = "The final archivist had 12 minutes to decide what humanity would remember forever.",
                Description = "A short story about the final moments before humanity's collective memory is transferred to a quantum archive — and one archivist's last-minute discovery.",
                CoverImageUrl = "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=80",
                AuthorName = "M. Voss",
                CategoryId = GetCat("Sci-Fi").Id,
                PublishDate = null,
                IsPublish = false,
                CreatedOn = now.AddDays(-2),
                CreatedBy = seededBy,
                Tags = new List<Tag> { GetTag("fiction"), GetTag("sci-fi") },
                StoryDetails = new List<StoryDetail>
                {
                    new()
                    {
                        Revision = 1, IsPublish = false,
                        SavePath = "stories/fiction/the-last-upload-draft.md",
                        Content = "# The Last Upload\n\n*Draft — not for publication*\n\nThe countdown read 00:12:07 when Dr. Yara Osei noticed the anomaly.\n\nAround her, the Archive hummed — sixteen exabytes of compressed human memory, emotion, and culture waiting for the final transfer sequence. In eleven minutes and fifty-three seconds, the quantum channel would open. In eleven minutes and fifty-four seconds, it would close forever.\n\nYara had spent six years curating this upload. Every Shakespeare folio. Every surviving symphony. The laughter of grandmothers and the drawings of children who no longer existed. The weight of it pressed against her sternum like a held breath.\n\nThen she saw the file.\n\n*EXCLUDED_FROM_ARCHIVE: conflict_resolution_protocols_ver4.7_FINAL_DO_NOT_UPLOAD*\n\nShe stared at the filename for three seconds — an eternity in the countdown. Then she opened it.\n\nInside were not protocols. Inside was a folder labeled *Voices We Decided Were Too Dangerous to Preserve.*\n\nNine hundred and forty-three thousand files.\n\n\"Dr. Osei.\" The facility AI spoke in the calm register reserved for impending deadlines. \"Upload window in T-minus eleven minutes.\"\n\nYara's hand moved to the authorization panel. To include the folder would push the transfer to 104% capacity. The compression would fail. The window would close.\n\nTo exclude it meant the Archive would carry humanity's curated best — and none of its honest mess.\n\n\"T-minus ten minutes.\"\n\nShe thought of the committee meetings. The arguments about purity and signal-to-noise. The quiet consensus that some voices would confuse whoever found this record among the stars.\n\nShe thought of her grandmother, who had never been curated in her life.\n\n\"T-minus nine minutes.\"\n\nYara typed her override code.",
                        WordCount = 290, ScoreWeight = 1.0m, ChangeNotes = "Initial draft.",
                        CreatedOn = now.AddDays(-2), CreatedBy = seededBy
                    }
                }
            },
        };

        db.Stories.AddRange(stories);
        await db.SaveChangesAsync();
    }

    private static async Task SeedInteractiveStoriesAsync(ApplicationDbContext db, List<Category> categories)
    {
        // Idempotent: skip if stories already exist with ScoreDeltas (new structure).
        // Re-seed from scratch if the old structure (empty ScoreDeltas) is detected.
        var wmStory = await db.Stories.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Slug == "washing-machine-dilemma");
        if (wmStory is not null)
        {
            var firstAnswer = await db.StoryNodeAnswers
                .Include(a => a.StoryNode).ThenInclude(n => n.StoryDetail)
                .Where(a => a.StoryNode.StoryDetail.StoryId == wmStory.Id)
                .FirstOrDefaultAsync();

            if (firstAnswer?.ScoreDeltas.Count > 0 && firstAnswer.TextVi != null) return; // already migrated with Vi content

            // Delete old stories so we can re-seed with the new ScoreDeltas structure
            var old = await db.Stories.IgnoreQueryFilters()
                .Where(s => s.Slug == "washing-machine-dilemma" || s.Slug == "game-or-learn-lazy-day")
                .ToListAsync();
            db.Stories.RemoveRange(old);
            await db.SaveChangesAsync();
        }

        var now = DateTime.UtcNow;
        const string seededBy = "system";

        Category GetCat(string title) => categories.First(c => c.Title == title);

        // ── Story 1: The Washing Machine Dilemma ─────────────────────────────

        var wm1 = new StoryNode
        {
            Question = "Your old washing machine just gave up. Laundry is piling up. What's your first move?",
            QuestionVi = "Máy giặt cũ của bạn vừa hỏng. Đống quần áo chưa giặt ngày càng chất cao. Bạn sẽ làm gì đầu tiên?",
            QuestionSubtitle = "Every decision starts somewhere.",
            QuestionSubtitleVi = "Mọi quyết định đều bắt đầu từ đâu đó.",
            IsStart = true, BackgroundColor = "#1e3a5f", AnimationType = "fade", SortOrder = 0,
        };
        var wm2 = new StoryNode
        {
            Question = "You're deep in a review rabbit hole. Top-load vs front-load. RPM counts. Energy ratings. What do you focus on?",
            QuestionVi = "Bạn đang chìm đắm trong vô số đánh giá. Cửa trên hay cửa trước. Số vòng quay. Tiết kiệm điện. Bạn tập trung vào điều gì?",
            QuestionSubtitle = "Beware the rabbit hole...",
            QuestionSubtitleVi = "Coi chừng bị cuốn vào vòng xoáy nghiên cứu...",
            BackgroundColor = "#0d2137", AnimationType = "slide-left", SortOrder = 1,
        };
        var wm3 = new StoryNode
        {
            Question = "The salesperson steers you toward a $1,200 front-loader. 'It's our bestseller — on sale today only.' What do you do?",
            QuestionVi = "Nhân viên bán hàng đang dẫn bạn đến chiếc máy giặt cửa trước giá $1.200. 'Đây là sản phẩm bán chạy nhất — hôm nay giảm giá đặc biệt.' Bạn làm gì?",
            QuestionSubtitle = "Sales pressure is real.",
            QuestionSubtitleVi = "Áp lực từ nhân viên bán hàng là có thật.",
            BackgroundColor = "#4a1a1a", AnimationType = "zoom", SortOrder = 2,
        };
        var wm4 = new StoryNode
        {
            Question = "Your neighbor loves their Samsung. Your cousin had nothing but trouble with theirs. Mixed signals!",
            QuestionVi = "Hàng xóm của bạn rất thích máy Samsung của họ. Còn người anh họ thì chỉ gặp rắc rối với chiếc đó. Tín hiệu hỗn độn!",
            QuestionSubtitle = "Word of mouth cuts both ways.",
            QuestionSubtitleVi = "Lời truyền miệng có thể đi theo cả hai chiều.",
            BackgroundColor = "#1a3a1a", AnimationType = "fade", SortOrder = 3,
        };
        var wm5 = new StoryNode
        {
            Question = "You found a reliable mid-range model at $650 — 4.2 stars with 2,000+ reviews. What now?",
            QuestionVi = "Bạn tìm được một mẫu tầm trung đáng tin cậy giá $650 — 4,2 sao với hơn 2.000 đánh giá. Tiếp theo?",
            QuestionSubtitle = "Good enough is sometimes perfect.",
            QuestionSubtitleVi = "Đủ tốt đôi khi chính là hoàn hảo.",
            BackgroundColor = "#2a2a4a", AnimationType = "slide-left", SortOrder = 4,
        };
        var wm6 = new StoryNode
        {
            Question = "The Energy Star model costs $300 more but saves ~$85/year on electricity. Pays off in 3.5 years.",
            QuestionVi = "Mẫu tiết kiệm điện đắt hơn $300 nhưng tiết kiệm khoảng $85/năm tiền điện. Hoàn vốn sau 3,5 năm.",
            QuestionSubtitle = "Short-term cost vs long-term saving.",
            QuestionSubtitleVi = "Chi phí ngắn hạn so với tiết kiệm dài hạn.",
            BackgroundColor = "#1a4a2a", AnimationType = "fade", SortOrder = 5,
        };
        var wm7 = new StoryNode
        {
            Question = "A trusted brand with a 5-year warranty and excellent service record. It's $800.",
            QuestionVi = "Một thương hiệu uy tín với bảo hành 5 năm và dịch vụ hậu mãi xuất sắc. Giá $800.",
            QuestionSubtitle = "Sometimes paying more is paying less.",
            QuestionSubtitleVi = "Đôi khi trả thêm chính là tiết kiệm.",
            BackgroundColor = "#2a1a4a", AnimationType = "zoom", SortOrder = 6,
        };

        static Dictionary<string, int> WmD(int research, int patience, int budget) =>
            new() { ["research"] = research, ["patience"] = patience, ["budget_sense"] = budget };

        wm1.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Research online first — read reviews and compare specs", TextVi = "Tìm hiểu trực tuyến trước — đọc đánh giá và so sánh thông số", PointsAwarded = 15, ScoreDeltas = WmD(10, 5, 0), Color = "#2563eb", SortOrder = 0, NextNode = wm2, Feedback = "Smart start — data beats gut feelings when buying appliances.", FeedbackVi = "Khởi đầu thông minh — dữ liệu luôn đáng tin hơn cảm tính khi mua đồ gia dụng." },
            new() { Text = "Head straight to the appliance store", TextVi = "Đến thẳng cửa hàng điện máy", PointsAwarded = 5, ScoreDeltas = WmD(0, 0, 0), Color = "#7c3aed", SortOrder = 1, NextNode = wm3, Feedback = "Walking in cold puts you at a disadvantage with salespeople.", FeedbackVi = "Vào mà không chuẩn bị trước sẽ khiến bạn dễ bị nhân viên bán hàng dẫn dắt." },
            new() { Text = "Ask friends and family for recommendations", TextVi = "Hỏi ý kiến bạn bè và gia đình", PointsAwarded = 8, ScoreDeltas = WmD(5, 5, 0), Color = "#059669", SortOrder = 2, NextNode = wm4, Feedback = "Social proof is useful — but always cross-check with reviews.", FeedbackVi = "Kinh nghiệm của người quen hữu ích — nhưng hãy kiểm chứng thêm qua các đánh giá khác." },
        };
        wm2.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Price vs. reliability — I want the best value", TextVi = "Giá cả so với độ bền — tôi muốn sản phẩm tốt nhất trong tầm tiền", PointsAwarded = 15, ScoreDeltas = WmD(10, 5, 15), Color = "#2563eb", SortOrder = 0, NextNode = wm5, Feedback = "Value-focused thinking prevents both over- and under-spending.", FeedbackVi = "Tư duy tập trung vào giá trị giúp bạn không tiêu quá nhiều lẫn quá ít." },
            new() { Text = "Energy Star ratings — I want lower bills long-term", TextVi = "Chứng nhận tiết kiệm điện — tôi muốn giảm hóa đơn về lâu dài", PointsAwarded = 12, ScoreDeltas = WmD(10, 10, 10), Color = "#059669", SortOrder = 1, NextNode = wm6, Feedback = "Long-term thinking — that $300 premium often pays back in 3–4 years.", FeedbackVi = "Tư duy dài hạn — khoản chênh lệch $300 đó thường được hoàn vốn trong 3–4 năm." },
            new() { Text = "Brand reputation — I'll stick with a trusted name", TextVi = "Uy tín thương hiệu — tôi chọn tên tuổi đáng tin cậy", PointsAwarded = 10, ScoreDeltas = WmD(5, 10, 5), Color = "#7c3aed", SortOrder = 2, NextNode = wm7, Feedback = "Brand trust reduces research risk but may mean paying a premium.", FeedbackVi = "Tin tưởng thương hiệu giảm rủi ro nghiên cứu nhưng thường phải trả giá cao hơn." },
            new() { Text = "Honestly overwhelmed — close the laptop and take a walk", TextVi = "Thực ra tôi đang choáng ngợp — đóng laptop và đi dạo cho thoáng đầu", PointsAwarded = 0, ScoreDeltas = WmD(-5, -10, 0), Color = "#6b7280", SortOrder = 3, NextNodeId = null, Feedback = "Decision fatigue is real — but the pile of laundry isn't going anywhere.", FeedbackVi = "Mệt mỏi vì phải ra quyết định là có thật — nhưng đống quần áo bẩn sẽ không tự biến mất." },
        };
        wm3.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Politely ask to see mid-range options instead", TextVi = "Lịch sự đề nghị xem các mẫu tầm trung hơn", PointsAwarded = 15, ScoreDeltas = WmD(5, 12, 15), Color = "#2563eb", SortOrder = 0, NextNode = wm5, Feedback = "Redirecting a pushy salesperson takes confidence — well done.", FeedbackVi = "Chủ động điều hướng nhân viên bán hàng cần sự tự tin — tốt lắm." },
            new() { Text = "Ask for the full spec sheet and compare quietly", TextVi = "Yêu cầu bảng thông số đầy đủ và tự so sánh", PointsAwarded = 20, ScoreDeltas = WmD(15, 10, 10), Color = "#059669", SortOrder = 1, NextNode = wm6, Feedback = "Getting data in-store gives you the best of both worlds.", FeedbackVi = "Thu thập dữ liệu tại cửa hàng giúp bạn có cả hai lợi thế." },
            new() { Text = "The salesperson is convincing… add it to cart on impulse", TextVi = "Nhân viên quá thuyết phục... bốc đồng bỏ vào giỏ hàng", PointsAwarded = 0, ScoreDeltas = WmD(-5, -10, -15), Color = "#dc2626", SortOrder = 2, NextNodeId = null, Feedback = "'Today only' is almost never true. Urgency is a sales tactic.", FeedbackVi = "'Chỉ hôm nay' gần như chẳng bao giờ là thật. Tạo cảm giác khẩn cấp là chiêu bán hàng cổ điển." },
        };
        wm4.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Cross-reference both experiences with professional reviews", TextVi = "Đối chiếu cả hai kinh nghiệm với các đánh giá chuyên nghiệp", PointsAwarded = 15, ScoreDeltas = WmD(15, 10, 5), Color = "#2563eb", SortOrder = 0, NextNode = wm2, Feedback = "Combining anecdotes with data is the most reliable approach.", FeedbackVi = "Kết hợp câu chuyện cá nhân với dữ liệu là cách đáng tin cậy nhất." },
            new() { Text = "Trust the neighbor — their laundry always looks great", TextVi = "Tin người hàng xóm — quần áo họ lúc nào cũng sạch đẹp", PointsAwarded = 8, ScoreDeltas = WmD(5, 5, 5), Color = "#059669", SortOrder = 1, NextNode = wm7, Feedback = "Word of mouth matters, but sample size of one is risky.", FeedbackVi = "Lời khuyên từ người quen có giá trị, nhưng mẫu chỉ có một người là quá ít." },
            new() { Text = "Pick a totally different brand and avoid the debate", TextVi = "Chọn thương hiệu hoàn toàn khác để tránh tranh luận", PointsAwarded = 8, ScoreDeltas = WmD(5, 5, 8), Color = "#7c3aed", SortOrder = 2, NextNode = wm5, Feedback = "Avoiding social friction with a neutral choice — pragmatic.", FeedbackVi = "Chọn trung lập để tránh bất hòa xã hội — thực dụng đấy." },
        };
        wm5.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Check three more sites — find it $80 cheaper with free installation", TextVi = "Kiểm tra thêm ba trang web — tìm được giá rẻ hơn $80 kèm lắp đặt miễn phí", PointsAwarded = 30, ScoreDeltas = WmD(20, 15, 20), Color = "#059669", SortOrder = 0, NextNodeId = null, Feedback = "That 15-minute price comparison just paid $80 plus saved on installation.", FeedbackVi = "Mười lăm phút so sánh giá vừa tiết kiệm được $80 cộng chi phí lắp đặt." },
            new() { Text = "Add to cart immediately — this is the one", TextVi = "Thêm vào giỏ ngay — đây là cái tôi cần", PointsAwarded = 15, ScoreDeltas = WmD(5, 0, 10), Color = "#2563eb", SortOrder = 1, NextNodeId = null, Feedback = "Quick decisiveness — just be sure you checked at least one competitor.", FeedbackVi = "Quyết đoán nhanh — nhưng hãy chắc chắn bạn đã kiểm tra ít nhất một nơi khác." },
            new() { Text = "Wait two months for the holiday sale", TextVi = "Đợi hai tháng đến đợt sale dịp lễ", PointsAwarded = 10, ScoreDeltas = WmD(5, 20, 15), Color = "#f59e0b", SortOrder = 2, NextNodeId = null, Feedback = "Patience pays — but factor in laundromat costs during the wait.", FeedbackVi = "Kiên nhẫn có lợi — nhưng hãy tính thêm chi phí giặt ủi trong lúc chờ đợi." },
        };
        wm6.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Worth it — I plan to use this machine for 10+ years", TextVi = "Xứng đáng — tôi dự định dùng máy này hơn 10 năm", PointsAwarded = 25, ScoreDeltas = WmD(10, 10, 20), Color = "#059669", SortOrder = 0, NextNodeId = null, Feedback = "Long-horizon thinking: total cost of ownership beats sticker price.", FeedbackVi = "Tư duy dài hạn: tổng chi phí sở hữu quan trọng hơn giá niêm yết." },
            new() { Text = "The upfront cost is too much — look for something cheaper", TextVi = "Chi phí ban đầu quá cao — tìm thứ gì rẻ hơn", PointsAwarded = 5, ScoreDeltas = WmD(5, 5, 5), Color = "#f59e0b", SortOrder = 1, NextNode = wm5, Feedback = "Valid — cash flow matters. Just make sure the cheaper model is reliable.", FeedbackVi = "Hợp lý — dòng tiền quan trọng. Chỉ cần đảm bảo mẫu rẻ hơn đáng tin cậy." },
        };
        wm7.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Buy it — peace of mind has a price and it's worth it", TextVi = "Mua ngay — sự an tâm có giá của nó và đáng đồng tiền", PointsAwarded = 20, ScoreDeltas = WmD(10, 10, 15), Color = "#059669", SortOrder = 0, NextNodeId = null, Feedback = "A solid warranty often covers the price difference in one service call.", FeedbackVi = "Bảo hành tốt thường bù đắp chênh lệch giá chỉ trong một lần sửa chữa." },
            new() { Text = "Negotiate a discount or extended warranty before buying", TextVi = "Thương lượng giảm giá hoặc gia hạn bảo hành trước khi mua", PointsAwarded = 25, ScoreDeltas = WmD(10, 10, 25), Color = "#2563eb", SortOrder = 1, NextNodeId = null, Feedback = "Negotiating in-store is underrated — retailers have more flexibility than you think.", FeedbackVi = "Thương lượng tại cửa hàng thường bị đánh giá thấp — người bán có nhiều linh hoạt hơn bạn nghĩ." },
        };

        var story1Detail = new StoryDetail
        {
            Revision = 1, IsPublish = true,
            SavePath = "interactive/real-life/washing-machine-dilemma",
            EffectiveDate = now.AddDays(-1),
            WordCount = 0, ScoreWeight = 1.3m,
            CreatedOn = now, CreatedBy = seededBy,
            StoryNodes = new List<StoryNode> { wm1, wm2, wm3, wm4, wm5, wm6, wm7 },
        };

        var story1 = new Story
        {
            Title = "The Washing Machine Dilemma",
            Slug = "washing-machine-dilemma",
            Excerpt = "Your machine just broke. Navigate salesperson pressure, spec overload, and budget decisions — can you find the right one without losing your mind?",
            Description = "An interactive journey through the surprisingly emotional process of buying a new washing machine. Every choice you make shapes the outcome.",
            CoverImageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
            AuthorName = "UpToU Editorial",
            StoryType = "Interactive",
            CategoryId = GetCat("Real Life").Id,
            PublishDate = now, IsPublish = true,
            CreatedOn = now, CreatedBy = seededBy,
            StoryDetails = new List<StoryDetail> { story1Detail },
        };

        // ── Story 2: Game or Learn? A Lazy Day Decision ───────────────────────

        var ld1 = new StoryNode
        {
            Question = "It's Saturday. No plans. The couch is calling. What does your gut say?",
            QuestionVi = "Hôm nay thứ Bảy. Không có kế hoạch gì. Chiếc ghế sofa đang gọi tên bạn. Trực giác bạn nói gì?",
            QuestionSubtitle = "There's no wrong answer. Or is there?",
            QuestionSubtitleVi = "Không có câu trả lời sai. Hay là có?",
            IsStart = true, BackgroundColor = "#1a1a2e", AnimationType = "fade", SortOrder = 0,
        };
        var ld2 = new StoryNode
        {
            Question = "Gaming it is! What kind of gaming mood are you in today?",
            QuestionVi = "Chơi game thôi! Hôm nay bạn đang trong tâm trạng chơi game kiểu nào?",
            BackgroundColor = "#0d1b2a", AnimationType = "slide-left", SortOrder = 1,
        };
        var ld3 = new StoryNode
        {
            Question = "You chose learning. But what kind of learning actually sounds appealing right now?",
            QuestionVi = "Bạn đã chọn học. Nhưng kiểu học nào thực sự hấp dẫn bạn lúc này?",
            BackgroundColor = "#1a2e1a", AnimationType = "zoom", SortOrder = 2,
        };
        var ld4 = new StoryNode
        {
            Question = "You flip a coin. It lands on LEARN. Your immediate gut reaction?",
            QuestionVi = "Bạn tung đồng xu. Nó ra HỌC. Phản ứng trực giác ngay lập tức của bạn?",
            QuestionSubtitle = "Your gut knows what you really want.",
            QuestionSubtitleVi = "Trực giác của bạn biết bạn thật sự muốn gì.",
            BackgroundColor = "#2e1a2e", AnimationType = "fade", SortOrder = 3,
        };
        var ld5 = new StoryNode
        {
            Question = "Three hours of competitive matches later. How's it going?",
            QuestionVi = "Sau ba tiếng đấu rank liên tục. Mọi chuyện thế nào rồi?",
            BackgroundColor = "#0d0d1a", AnimationType = "slide-left", SortOrder = 4,
        };
        var ld6 = new StoryNode
        {
            Question = "You found an indie game with gorgeous art and a calm vibe. Three hours pass like nothing.",
            QuestionVi = "Bạn tìm được một game indie với đồ họa tuyệt đẹp và không khí thư thái. Ba tiếng trôi qua như chớp.",
            BackgroundColor = "#1a1a0d", AnimationType = "fade", SortOrder = 5,
        };
        var ld7 = new StoryNode
        {
            Question = "You've been learning for 90 minutes. It's harder than expected. How are you doing?",
            QuestionVi = "Bạn đã học được 90 phút. Khó hơn dự kiến. Bạn đang thế nào?",
            BackgroundColor = "#0d2e1a", AnimationType = "zoom", SortOrder = 6,
        };
        var ld8 = new StoryNode
        {
            Question = "You fell into a Wikipedia spiral: Roman aqueducts → medieval siege engines → modern water infrastructure.",
            QuestionVi = "Bạn rơi vào vòng xoáy Wikipedia: Cống dẫn nước La Mã → vũ khí công thành thời Trung cổ → hạ tầng nước hiện đại.",
            QuestionSubtitle = "One hour in. Still going strong.",
            QuestionSubtitleVi = "Một tiếng rồi. Vẫn đang hăng hái.",
            BackgroundColor = "#2e1a0d", AnimationType = "slide-left", SortOrder = 7,
        };

        static Dictionary<string, int> LdD(int resilience, int growth, int clarity) =>
            new() { ["resilience"] = resilience, ["growth"] = growth, ["clarity"] = clarity };

        ld1.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Games. I just want to relax and have fun", TextVi = "Chơi game. Tôi chỉ muốn thư giãn và vui vẻ", PointsAwarded = 5, ScoreDeltas = LdD(5, 0, 5), Color = "#7c3aed", SortOrder = 0, NextNode = ld2, Feedback = "Rest is valid — the key is whether it's intentional or avoidance.", FeedbackVi = "Nghỉ ngơi là hợp lý — điều quan trọng là bạn chủ động chọn hay đang né tránh điều gì đó." },
            new() { Text = "Maybe I should do something productive...", TextVi = "Có lẽ mình nên làm gì đó có ích hơn...", PointsAwarded = 12, ScoreDeltas = LdD(5, 12, 8), Color = "#059669", SortOrder = 1, NextNode = ld3, Feedback = "Choosing discomfort over comfort — that's growth in action.", FeedbackVi = "Chọn sự khó chịu thay vì thoải mái — đó chính là sự phát triển đang diễn ra." },
            new() { Text = "I genuinely can't decide between gaming and learning", TextVi = "Thật sự tôi không thể chọn giữa chơi game và học", PointsAwarded = 8, ScoreDeltas = LdD(5, 5, 5), Color = "#f59e0b", SortOrder = 2, NextNode = ld4, Feedback = "Indecision is honest — at least you're aware of the tension.", FeedbackVi = "Không quyết được cũng là trung thực — ít nhất bạn đang nhận ra sự mâu thuẫn bên trong." },
        };
        ld2.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Something competitive — ranked matches, pure adrenaline", TextVi = "Gì đó cạnh tranh — leo rank, adrenaline thuần túy", PointsAwarded = 8, ScoreDeltas = LdD(8, 3, 3), Color = "#dc2626", SortOrder = 0, NextNode = ld5, Feedback = "Competitive play builds resilience — especially when you lose.", FeedbackVi = "Chơi cạnh tranh xây dựng sự kiên cường — đặc biệt là khi bạn thua." },
            new() { Text = "Something relaxing — chill indie or casual puzzle game", TextVi = "Gì đó thư giãn — indie chill hoặc game giải đố nhẹ nhàng", PointsAwarded = 10, ScoreDeltas = LdD(5, 5, 10), Color = "#059669", SortOrder = 1, NextNode = ld6, Feedback = "Deliberate rest is a skill. You chose calm over stimulation.", FeedbackVi = "Nghỉ ngơi có chủ đích là một kỹ năng. Bạn đã chọn sự bình yên thay vì kích thích." },
            new() { Text = "Couch co-op with a friend or partner", TextVi = "Chơi đồng đội trên ghế sofa cùng bạn bè hoặc người yêu", PointsAwarded = 15, ScoreDeltas = LdD(8, 8, 12), Color = "#2563eb", SortOrder = 2, NextNodeId = null, Feedback = "Social connection + play — hard to beat for overall wellbeing.", FeedbackVi = "Kết nối xã hội cộng với niềm vui chơi game — khó có gì bằng cho sức khỏe tinh thần." },
        };
        ld3.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "A practical skill — coding, cooking, woodworking, or design", TextVi = "Một kỹ năng thực tế — lập trình, nấu ăn, làm mộc, hoặc thiết kế", PointsAwarded = 20, ScoreDeltas = LdD(8, 20, 10), Color = "#059669", SortOrder = 0, NextNode = ld7, Feedback = "Practical learning compounds — each skill opens doors to new ones.", FeedbackVi = "Học kỹ năng thực tế có tính tích lũy — mỗi kỹ năng mở ra những kỹ năng mới." },
            new() { Text = "Something purely fascinating — history, science, philosophy", TextVi = "Gì đó hoàn toàn hấp dẫn — lịch sử, khoa học, triết học", PointsAwarded = 18, ScoreDeltas = LdD(5, 15, 18), Color = "#2563eb", SortOrder = 1, NextNode = ld8, Feedback = "Curiosity-driven learning is the most sustainable kind.", FeedbackVi = "Học vì tò mò là hình thức bền vững nhất." },
            new() { Text = "A new language — open Duolingo for the first time in months", TextVi = "Một ngoại ngữ mới — mở Duolingo lần đầu tiên sau nhiều tháng", PointsAwarded = 15, ScoreDeltas = LdD(10, 12, 8), Color = "#f59e0b", SortOrder = 2, NextNodeId = null, Feedback = "Starting (again) counts. Consistency over perfection.", FeedbackVi = "Bắt đầu (lại) vẫn tính. Kiên trì quan trọng hơn hoàn hảo." },
        };
        ld4.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Relieved! Today's the day I learn something new", TextVi = "Nhẹ nhõm! Hôm nay là ngày tôi học điều gì đó mới", PointsAwarded = 18, ScoreDeltas = LdD(8, 18, 15), Color = "#059669", SortOrder = 0, NextNode = ld3, Feedback = "Your gut already knew what you needed. You just needed permission.", FeedbackVi = "Trực giác của bạn đã biết bạn cần gì. Bạn chỉ cần được phép." },
            new() { Text = "Disappointed — I clearly wanted to game all along", TextVi = "Thất vọng — rõ ràng tôi muốn chơi game suốt", PointsAwarded = 10, ScoreDeltas = LdD(5, 5, 12), Color = "#dc2626", SortOrder = 1, NextNode = ld2, Feedback = "Self-awareness is clarity. Knowing what you want is valuable data.", FeedbackVi = "Tự nhận thức là sự rõ ràng. Biết mình muốn gì là thông tin quý giá." },
            new() { Text = "Ignore the coin: 1 hour learning, then gaming as reward", TextVi = "Bỏ qua đồng xu: 1 tiếng học, sau đó chơi game như phần thưởng", PointsAwarded = 22, ScoreDeltas = LdD(15, 15, 15), Color = "#7c3aed", SortOrder = 2, NextNodeId = null, Feedback = "Best of both worlds — structured balance over binary thinking.", FeedbackVi = "Được cả hai — cân bằng có cấu trúc thay vì tư duy đối lập." },
        };
        ld5.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "On a winning streak! Ranked up twice. Totally worth it", TextVi = "Đang thắng liên tiếp! Leo rank được hai bậc. Hoàn toàn xứng đáng", PointsAwarded = 15, ScoreDeltas = LdD(15, 8, 8), Color = "#059669", SortOrder = 0, NextNodeId = null, Feedback = "Wins feel great. The question is: what did you learn from the losses?", FeedbackVi = "Thắng rất tuyệt. Câu hỏi là: bạn học được gì từ những lần thua?" },
            new() { Text = "Lost 6 in a row. Frustrated, but somehow still here...", TextVi = "Thua 6 ván liên tiếp. Bực bội, nhưng bằng cách nào đó vẫn ở đây...", PointsAwarded = 8, ScoreDeltas = LdD(20, 5, 3), Color = "#dc2626", SortOrder = 1, NextNodeId = null, Feedback = "Staying through frustration is resilience. That's genuinely hard.", FeedbackVi = "Tiếp tục dù bực bội chính là sự kiên cường. Điều đó thực sự khó." },
            new() { Text = "Took a break and accidentally started a documentary", TextVi = "Nghỉ giải lao rồi tình cờ xem phim tài liệu", PointsAwarded = 18, ScoreDeltas = LdD(10, 15, 15), Color = "#2563eb", SortOrder = 2, NextNode = ld8, Feedback = "The best learning often sneaks up on you. Follow your curiosity.", FeedbackVi = "Việc học tốt nhất thường xuất hiện bất ngờ. Hãy theo đuổi sự tò mò." },
        };
        ld6.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Finished the whole game. Deeply satisfied day", TextVi = "Chơi xong cả game. Một ngày vô cùng thỏa mãn", PointsAwarded = 18, ScoreDeltas = LdD(10, 8, 18), Color = "#059669", SortOrder = 0, NextNodeId = null, Feedback = "Completion satisfaction is real. You honored your choice fully.", FeedbackVi = "Sự thỏa mãn khi hoàn thành là có thật. Bạn đã tôn trọng lựa chọn của mình trọn vẹn." },
            new() { Text = "Started seriously thinking about making my own indie game", TextVi = "Bắt đầu nghiêm túc nghĩ đến việc tự làm game indie", PointsAwarded = 22, ScoreDeltas = LdD(10, 22, 18), Color = "#7c3aed", SortOrder = 1, NextNodeId = null, Feedback = "Play inspired creation. That's how a lot of great things start.", FeedbackVi = "Niềm vui chơi đã truyền cảm hứng sáng tạo. Đó là cách nhiều thứ vĩ đại bắt đầu." },
        };
        ld7.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Built something small that actually works. Best feeling ever!", TextVi = "Tạo ra được thứ gì nhỏ nhưng thật sự hoạt động. Cảm giác tuyệt nhất từ trước đến nay!", PointsAwarded = 28, ScoreDeltas = LdD(15, 28, 15), Color = "#059669", SortOrder = 0, NextNodeId = null, Feedback = "Making something real is the fastest shortcut to competence and confidence.", FeedbackVi = "Tạo ra thứ gì đó thật là con đường tắt nhanh nhất đến năng lực và sự tự tin." },
            new() { Text = "Closed the tutorial after 30 min. It'll take more than one day", TextVi = "Đóng bài hướng dẫn sau 30 phút. Sẽ cần nhiều hơn một ngày", PointsAwarded = 10, ScoreDeltas = LdD(10, 10, 12), Color = "#f59e0b", SortOrder = 1, NextNodeId = null, Feedback = "Accurate self-assessment beats false confidence. You'll be back.", FeedbackVi = "Tự đánh giá chính xác tốt hơn sự tự tin giả tạo. Bạn sẽ quay lại." },
            new() { Text = "Made real progress — reward myself with gaming time", TextVi = "Đã tiến bộ thật sự — tự thưởng cho mình bằng thời gian chơi game", PointsAwarded = 22, ScoreDeltas = LdD(12, 20, 15), Color = "#2563eb", SortOrder = 2, NextNode = ld2, Feedback = "Structured reward systems actually work. You earned this.", FeedbackVi = "Hệ thống phần thưởng có cấu trúc thực sự hiệu quả. Bạn xứng đáng được hưởng." },
        };
        ld8.Answers = new List<StoryNodeAnswer>
        {
            new() { Text = "Four hours in — now I know more about Roman aqueducts than most archaeologists", TextVi = "Bốn tiếng sau — giờ tôi biết về cống dẫn nước La Mã nhiều hơn hầu hết các nhà khảo cổ", PointsAwarded = 22, ScoreDeltas = LdD(10, 18, 22), Color = "#2563eb", SortOrder = 0, NextNodeId = null, Feedback = "Deep dives build genuine understanding. Breadth is fine, but depth is rare.", FeedbackVi = "Đào sâu tạo ra sự hiểu biết thật sự. Rộng thì tốt, nhưng sâu mới là quý hiếm." },
            new() { Text = "It sparked a creative project I immediately started sketching out", TextVi = "Nó khơi dậy một dự án sáng tạo mà tôi bắt đầu phác thảo ngay", PointsAwarded = 28, ScoreDeltas = LdD(12, 28, 22), Color = "#7c3aed", SortOrder = 1, NextNodeId = null, Feedback = "Knowledge → idea → action. That's the creative loop in its purest form.", FeedbackVi = "Kiến thức → ý tưởng → hành động. Đó là vòng lặp sáng tạo ở dạng thuần túy nhất." },
        };

        var story2Detail = new StoryDetail
        {
            Revision = 1, IsPublish = true,
            SavePath = "interactive/self-improvement/lazy-day-decision",
            EffectiveDate = now,
            WordCount = 0, ScoreWeight = 1.2m,
            CreatedOn = now, CreatedBy = seededBy,
            StoryNodes = new List<StoryNode> { ld1, ld2, ld3, ld4, ld5, ld6, ld7, ld8 },
        };

        var story2 = new Story
        {
            Title = "Game or Learn? A Lazy Day Decision",
            Slug = "game-or-learn-lazy-day",
            Excerpt = "It's Saturday. No plans. Do you fire up a game or push yourself to learn something? Every path reveals something about how you really spend your free time.",
            Description = "An interactive story exploring the internal battle between rest, entertainment, and growth on a free day. Follow your instincts and see where you end up.",
            CoverImageUrl = "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80",
            AuthorName = "UpToU Editorial",
            StoryType = "Interactive",
            CategoryId = GetCat("Mindset").Id,
            PublishDate = now, IsPublish = true,
            CreatedOn = now, CreatedBy = seededBy,
            StoryDetails = new List<StoryDetail> { story2Detail },
        };

        db.Stories.AddRange(story1, story2);
        await db.SaveChangesAsync();
    }
}
