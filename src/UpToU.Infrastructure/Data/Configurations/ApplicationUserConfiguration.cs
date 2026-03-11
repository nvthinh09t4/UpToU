using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(u => u.FirstName)
               .HasMaxLength(100)
               .IsRequired();

        builder.Property(u => u.LastName)
               .HasMaxLength(100)
               .IsRequired();

        builder.Property(u => u.MentionHandle)
               .HasMaxLength(100)
               .IsRequired(false);

        builder.HasIndex(u => u.MentionHandle)
               .IsUnique()
               .HasFilter("[MentionHandle] IS NOT NULL");

        builder.Property(u => u.CreditBalance)
               .HasDefaultValue(0);

        builder.Property(u => u.ActiveTitle)
               .HasMaxLength(100)
               .IsRequired(false);

        builder.Property(u => u.ActiveAvatarFrameUrl)
               .HasMaxLength(500)
               .IsRequired(false);

        builder.Property(u => u.AvatarUrl)
               .HasMaxLength(500)
               .IsRequired(false);

        builder.Property(u => u.FavoriteQuote)
               .HasMaxLength(200)
               .IsRequired(false);

        builder.HasMany(u => u.RefreshTokens)
               .WithOne(rt => rt.User)
               .HasForeignKey(rt => rt.UserId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
