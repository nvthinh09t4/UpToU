using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class StoryDetailConfiguration : IEntityTypeConfiguration<StoryDetail>
{
    public void Configure(EntityTypeBuilder<StoryDetail> builder)
    {
        builder.HasKey(sd => sd.Id);

        // Match the global query filter on Story so EF never returns details for soft-deleted stories
        builder.HasQueryFilter(sd => !sd.Story.IsDeleted);

        builder.Property(sd => sd.SavePath).HasMaxLength(2000).IsRequired();
        builder.Property(sd => sd.Content).HasColumnType("nvarchar(max)");
        builder.Property(sd => sd.ChangeNotes).HasMaxLength(1000);
        builder.Property(sd => sd.CreatedBy).HasMaxLength(450);
        builder.Property(sd => sd.CreatedOn).IsRequired();

        builder.Property(sd => sd.ScoreWeight)
               .HasColumnType("decimal(18,4)")
               .IsRequired();

        builder.Property(sd => sd.ScoreWeightHistory)
               .HasConversion(
                   v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                   v => JsonSerializer.Deserialize<List<decimal>>(v, (JsonSerializerOptions?)null) ?? new List<decimal>(),
                   new ValueComparer<List<decimal>>(
                       (a, b) => a != null && b != null && a.SequenceEqual(b),
                       v => v.Aggregate(0, (h, e) => HashCode.Combine(h, e.GetHashCode())),
                       v => v.ToList()))
               .HasColumnType("nvarchar(max)")
               .IsRequired();

        builder.Property(sd => sd.EffectiveDate);
        builder.HasIndex(sd => new { sd.StoryId, sd.EffectiveDate });

        builder.HasIndex(sd => sd.StoryId);
        builder.HasIndex(sd => sd.IsPublish);
        builder.HasIndex(sd => new { sd.StoryId, sd.Revision }).IsUnique();

        builder.HasOne(sd => sd.Story)
               .WithMany(s => s.StoryDetails)
               .HasForeignKey(sd => sd.StoryId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
