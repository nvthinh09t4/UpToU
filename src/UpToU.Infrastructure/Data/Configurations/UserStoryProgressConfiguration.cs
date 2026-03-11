using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class UserStoryProgressConfiguration : IEntityTypeConfiguration<UserStoryProgress>
{
    public void Configure(EntityTypeBuilder<UserStoryProgress> builder)
    {
        builder.HasKey(p => p.Id);

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Story)
            .WithMany()
            .HasForeignKey(p => p.StoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.StoryDetail)
            .WithMany()
            .HasForeignKey(p => p.StoryDetailId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.CurrentNode)
            .WithMany()
            .HasForeignKey(p => p.CurrentNodeId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .IsRequired(false);

        // One progress record per user per story
        builder.HasIndex(p => new { p.UserId, p.StoryId }).IsUnique();
        builder.HasIndex(p => p.UserId);
        builder.HasIndex(p => p.StoryId);
    }
}
