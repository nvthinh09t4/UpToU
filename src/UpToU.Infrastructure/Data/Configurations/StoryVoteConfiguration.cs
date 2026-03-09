using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class StoryVoteConfiguration : IEntityTypeConfiguration<StoryVote>
{
    public void Configure(EntityTypeBuilder<StoryVote> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.VoteType).HasMaxLength(10).IsRequired();

        builder.HasOne(v => v.Story)
            .WithMany(s => s.StoryVotes)
            .HasForeignKey(v => v.StoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.User)
            .WithMany()
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // One vote per user per story
        builder.HasIndex(v => new { v.StoryId, v.UserId }).IsUnique();
    }
}
