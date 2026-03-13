using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class StoryTranslationConfiguration : IEntityTypeConfiguration<StoryTranslation>
{
    public void Configure(EntityTypeBuilder<StoryTranslation> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Language)
               .HasMaxLength(10)
               .IsRequired();

        builder.Property(t => t.Title)
               .HasMaxLength(500)
               .IsRequired();

        builder.Property(t => t.Description)
               .HasMaxLength(5000);

        builder.Property(t => t.Excerpt)
               .HasMaxLength(1000);

        builder.Property(t => t.Content)
               .HasColumnType("nvarchar(max)");

        builder.Property(t => t.CreatedBy).HasMaxLength(450);
        builder.Property(t => t.ModifiedBy).HasMaxLength(450);
        builder.Property(t => t.CreatedOn).IsRequired();

        // One translation per language per story
        builder.HasIndex(t => new { t.StoryId, t.Language }).IsUnique();
        builder.HasIndex(t => t.Language);

        builder.HasOne(t => t.Story)
               .WithMany(s => s.Translations)
               .HasForeignKey(t => t.StoryId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
