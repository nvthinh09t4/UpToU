using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Title)
               .HasMaxLength(200)
               .IsRequired();

        builder.Property(c => c.Description)
               .HasMaxLength(2000);

        builder.Property(c => c.ScoreWeight)
               .HasColumnType("decimal(18,4)")
               .IsRequired();

        builder.Property(c => c.ScoreWeightHistory)
               .HasConversion(
                   v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                   v => JsonSerializer.Deserialize<List<decimal>>(v, (JsonSerializerOptions?)null) ?? new List<decimal>(),
                   new ValueComparer<List<decimal>>(
                       (a, b) => a != null && b != null && a.SequenceEqual(b),
                       v => v.Aggregate(0, (h, e) => HashCode.Combine(h, e.GetHashCode())),
                       v => v.ToList()))
               .HasColumnType("nvarchar(max)")
               .IsRequired();

        builder.Property(c => c.CreatedBy).HasMaxLength(450);
        builder.Property(c => c.ModifiedBy).HasMaxLength(450);
        builder.Property(c => c.CreatedOn).IsRequired();

        builder.HasIndex(c => c.OrderToShow);
        builder.HasIndex(c => c.IsDeleted);
        builder.HasIndex(c => c.ParentId);

        builder.HasQueryFilter(c => !c.IsDeleted);

        builder.HasOne(c => c.Parent)
               .WithMany(c => c.Children)
               .HasForeignKey(c => c.ParentId)
               .OnDelete(DeleteBehavior.Restrict)
               .IsRequired(false);
    }
}
