using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class StoryNodeAnswerConfiguration : IEntityTypeConfiguration<StoryNodeAnswer>
{
    public void Configure(EntityTypeBuilder<StoryNodeAnswer> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Text).HasMaxLength(500).IsRequired();
        builder.Property(a => a.TextVi).HasMaxLength(500);
        builder.Property(a => a.Color).HasMaxLength(50);

        builder.Property(a => a.ScoreDeltas)
               .HasConversion(
                   v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                   v => JsonSerializer.Deserialize<Dictionary<string, int>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, int>(),
                   new ValueComparer<Dictionary<string, int>>(
                       (a, b) => a != null && b != null && a.Count == b.Count && !a.Except(b).Any(),
                       v => v.Aggregate(0, (h, kv) => HashCode.Combine(h, kv.Key.GetHashCode(), kv.Value.GetHashCode())),
                       v => new Dictionary<string, int>(v)))
               .HasColumnType("nvarchar(max)")
               .IsRequired();

        // The parent node that owns this answer
        builder.HasOne(a => a.StoryNode)
            .WithMany(n => n.Answers)
            .HasForeignKey(a => a.StoryNodeId)
            .OnDelete(DeleteBehavior.Cascade);

        // The next node this answer jumps to (different FK, set null to avoid cycles)
        builder.HasOne(a => a.NextNode)
            .WithMany()
            .HasForeignKey(a => a.NextNodeId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .IsRequired(false);

        builder.HasIndex(a => a.StoryNodeId);
        builder.HasIndex(a => a.NextNodeId);
    }
}
