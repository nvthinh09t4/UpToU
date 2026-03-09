using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class ReactionConfiguration : IEntityTypeConfiguration<Reaction>
{
    public void Configure(EntityTypeBuilder<Reaction> builder)
    {
        builder.Property(r => r.ReactionType)
               .HasMaxLength(20)
               .IsRequired();

        builder.Property(r => r.UserId)
               .HasMaxLength(450)
               .IsRequired();

        builder.HasOne(r => r.Story)
               .WithMany(s => s.Reactions)
               .HasForeignKey(r => r.StoryId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.User)
               .WithMany(u => u.Reactions)
               .HasForeignKey(r => r.UserId)
               .OnDelete(DeleteBehavior.Cascade);

        // One reaction per user per story
        builder.HasIndex(r => new { r.StoryId, r.UserId }).IsUnique();
    }
}
