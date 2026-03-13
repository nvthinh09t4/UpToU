using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Story> Stories => Set<Story>();
    public DbSet<StoryDetail> StoryDetails => Set<StoryDetail>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Reaction> Reactions => Set<Reaction>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<StoryVote> StoryVotes => Set<StoryVote>();
    public DbSet<CommentVote> CommentVotes => Set<CommentVote>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
    public DbSet<CreditTransaction> CreditTransactions => Set<CreditTransaction>();
    public DbSet<RewardItem> RewardItems => Set<RewardItem>();
    public DbSet<UserReward> UserRewards => Set<UserReward>();
    public DbSet<UserBan> UserBans => Set<UserBan>();
    public DbSet<StoryNode> StoryNodes => Set<StoryNode>();
    public DbSet<StoryNodeAnswer> StoryNodeAnswers => Set<StoryNodeAnswer>();
    public DbSet<UserStoryProgress> UserStoryProgresses => Set<UserStoryProgress>();
    public DbSet<UserStoryAnswer> UserStoryAnswers => Set<UserStoryAnswer>();
    public DbSet<ContributedPointTransaction> ContributedPointTransactions => Set<ContributedPointTransaction>();
    public DbSet<CategoryScoreType> CategoryScoreTypes => Set<CategoryScoreType>();
    public DbSet<StoryTranslation> StoryTranslations => Set<StoryTranslation>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
