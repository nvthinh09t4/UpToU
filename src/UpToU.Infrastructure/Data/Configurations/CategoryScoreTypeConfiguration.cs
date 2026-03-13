using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class CategoryScoreTypeConfiguration : IEntityTypeConfiguration<CategoryScoreType>
{
    public void Configure(EntityTypeBuilder<CategoryScoreType> builder)
    {
        builder.HasKey(st => st.Id);

        builder.Property(st => st.Name)
               .HasMaxLength(100)
               .IsRequired();

        builder.Property(st => st.Label)
               .HasMaxLength(200);

        builder.Property(st => st.ScoreWeight)
               .HasColumnType("decimal(18,4)")
               .IsRequired();

        builder.HasIndex(st => st.CategoryId);
        builder.HasIndex(st => new { st.CategoryId, st.Name }).IsUnique();
        builder.HasIndex(st => st.OrderToShow);

        builder.HasOne(st => st.Category)
               .WithMany(c => c.ScoreTypes)
               .HasForeignKey(st => st.CategoryId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
