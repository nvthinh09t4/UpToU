using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class StoryRatingConfiguration : IEntityTypeConfiguration<StoryRating>
{
    public void Configure(EntityTypeBuilder<StoryRating> builder)
    {
        builder.HasKey(r => r.Id);
        builder.HasIndex(r => new { r.UserId, r.StoryId }).IsUnique();
        builder.HasIndex(r => r.StoryId);
        builder.Property(r => r.Comment).HasMaxLength(1000);
        builder.Property(r => r.CreatedAt).HasColumnType("datetime2");
        builder.Property(r => r.UpdatedAt).HasColumnType("datetime2");

        builder.HasOne(r => r.Story)
            .WithMany()
            .HasForeignKey(r => r.StoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
