using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class CategoryBadgeConfiguration : IEntityTypeConfiguration<CategoryBadge>
{
    public void Configure(EntityTypeBuilder<CategoryBadge> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Label).HasMaxLength(200).IsRequired();
        builder.Property(b => b.LabelVi).HasMaxLength(200);
        builder.Property(b => b.BadgeImageUrl).HasMaxLength(2000);

        builder.HasOne(b => b.Category)
            .WithMany()
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // One badge per tier per category
        builder.HasIndex(b => new { b.CategoryId, b.Tier }).IsUnique();
        builder.HasIndex(b => b.CategoryId);
    }
}
