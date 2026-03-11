using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class StoryConfiguration : IEntityTypeConfiguration<Story>
{
    public void Configure(EntityTypeBuilder<Story> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Title).HasMaxLength(500).IsRequired();
        builder.Property(s => s.Slug).HasMaxLength(600);
        builder.Property(s => s.Description).HasMaxLength(5000);
        builder.Property(s => s.Excerpt).HasMaxLength(1000);
        builder.Property(s => s.CoverImageUrl).HasMaxLength(2000);
        builder.Property(s => s.AuthorName).HasMaxLength(200);
        builder.Property(s => s.CreatedBy).HasMaxLength(450);
        builder.Property(s => s.ModifiedBy).HasMaxLength(450);
        builder.Property(s => s.CreatedOn).IsRequired();

        builder.HasIndex(s => s.IsDeleted);
        builder.HasIndex(s => s.IsPublish);
        builder.HasIndex(s => s.CategoryId);
        builder.HasIndex(s => s.Slug).IsUnique().HasFilter("[Slug] IS NOT NULL");

        builder.Property(s => s.StoryType).HasMaxLength(20).HasDefaultValue("Article");
        builder.HasIndex(s => s.StoryType);

        builder.HasQueryFilter(s => !s.IsDeleted);

        builder.HasOne(s => s.Category)
               .WithMany(c => c.Stories)
               .HasForeignKey(s => s.CategoryId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.Tags)
               .WithMany(t => t.Stories)
               .UsingEntity(j => j.ToTable("StoryTags"));
    }
}
