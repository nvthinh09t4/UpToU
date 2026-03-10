using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class CommentVoteConfiguration : IEntityTypeConfiguration<CommentVote>
{
    public void Configure(EntityTypeBuilder<CommentVote> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.VoteType).HasMaxLength(10).IsRequired();

        builder.HasOne(v => v.Comment)
            .WithMany(c => c.CommentVotes)
            .HasForeignKey(v => v.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.User)
            .WithMany()
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // One vote per user per comment
        builder.HasIndex(v => new { v.CommentId, v.UserId }).IsUnique();
    }
}
