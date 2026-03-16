using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class UserCategoryBadgeConfiguration : IEntityTypeConfiguration<UserCategoryBadge>
{
    public void Configure(EntityTypeBuilder<UserCategoryBadge> builder)
    {
        builder.HasKey(ub => ub.Id);

        builder.HasOne(ub => ub.User)
            .WithMany()
            .HasForeignKey(ub => ub.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ub => ub.Badge)
            .WithMany(b => b.UserBadges)
            .HasForeignKey(ub => ub.BadgeId)
            .OnDelete(DeleteBehavior.Cascade);

        // A user earns each badge exactly once
        builder.HasIndex(ub => new { ub.UserId, ub.BadgeId }).IsUnique();
        builder.HasIndex(ub => ub.UserId);
    }
}
