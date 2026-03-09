using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.Property(c => c.Body)
               .HasMaxLength(5000)
               .IsRequired();

        builder.Property(c => c.AuthorId)
               .HasMaxLength(450)
               .IsRequired();

        builder.HasOne(c => c.Story)
               .WithMany(s => s.Comments)
               .HasForeignKey(c => c.StoryId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Author)
               .WithMany(u => u.Comments)
               .HasForeignKey(c => c.AuthorId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.ParentComment)
               .WithMany(c => c.Replies)
               .HasForeignKey(c => c.ParentCommentId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(c => !c.IsDeleted);

        builder.HasIndex(c => c.StoryId);
        builder.HasIndex(c => c.AuthorId);
        builder.HasIndex(c => c.ParentCommentId);
    }
}
