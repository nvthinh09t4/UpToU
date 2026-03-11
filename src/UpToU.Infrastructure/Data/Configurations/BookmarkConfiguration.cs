using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class BookmarkConfiguration : IEntityTypeConfiguration<Bookmark>
{
    public void Configure(EntityTypeBuilder<Bookmark> builder)
    {
        builder.HasKey(b => b.Id);

        // Match the global query filter on Story so EF never returns bookmarks for soft-deleted stories
        builder.HasQueryFilter(b => !b.Story.IsDeleted);

        builder.HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(b => b.Story)
            .WithMany()
            .HasForeignKey(b => b.StoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // One bookmark per user per story
        builder.HasIndex(b => new { b.UserId, b.StoryId }).IsUnique();
        builder.HasIndex(b => new { b.UserId, b.CreatedAt });
    }
}
