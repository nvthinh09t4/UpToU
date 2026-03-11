using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class UserBanConfiguration : IEntityTypeConfiguration<UserBan>
{
    public void Configure(EntityTypeBuilder<UserBan> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.UserId).IsRequired().HasMaxLength(450);
        builder.Property(b => b.BanType).IsRequired().HasMaxLength(20);
        builder.Property(b => b.Reason).IsRequired().HasMaxLength(1000);
        builder.Property(b => b.IssuedBy).IsRequired().HasMaxLength(450);
        builder.Property(b => b.RevokedBy).HasMaxLength(450).IsRequired(false);

        builder.HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(b => b.Category)
            .WithMany()
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(b => new { b.UserId, b.BanType });
        builder.HasIndex(b => b.UserId);

        builder.Ignore(b => b.IsActive);
    }
}
