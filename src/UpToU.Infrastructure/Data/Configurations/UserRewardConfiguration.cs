using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class UserRewardConfiguration : IEntityTypeConfiguration<UserReward>
{
    public void Configure(EntityTypeBuilder<UserReward> builder)
    {
        builder.HasKey(ur => ur.Id);

        builder.Property(ur => ur.UserId).IsRequired().HasMaxLength(450);

        builder.HasOne(ur => ur.User)
            .WithMany(u => u.UserRewards)
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ur => ur.RewardItem)
            .WithMany(r => r.UserRewards)
            .HasForeignKey(ur => ur.RewardItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // One unlock per user per reward
        builder.HasIndex(ur => new { ur.UserId, ur.RewardItemId }).IsUnique();
        builder.HasIndex(ur => new { ur.UserId, ur.IsActive });
    }
}
