using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class UserStreakConfiguration : IEntityTypeConfiguration<UserStreak>
{
    public void Configure(EntityTypeBuilder<UserStreak> builder)
    {
        builder.HasKey(s => s.Id);
        builder.HasIndex(s => s.UserId).IsUnique();
        builder.Property(s => s.UpdatedAt).HasColumnType("datetime2");
        builder.Property(s => s.LastCompletionDate).HasColumnType("datetime2");

        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
