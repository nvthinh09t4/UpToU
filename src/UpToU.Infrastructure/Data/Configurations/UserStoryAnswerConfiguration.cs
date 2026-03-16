using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class UserStoryAnswerConfiguration : IEntityTypeConfiguration<UserStoryAnswer>
{
    public void Configure(EntityTypeBuilder<UserStoryAnswer> builder)
    {
        builder.HasKey(a => a.Id);

        builder.HasOne(a => a.Progress)
            .WithMany(p => p.Answers)
            .HasForeignKey(a => a.ProgressId)
            .OnDelete(DeleteBehavior.Cascade);

        // No navigation to Node/Answer — just store IDs (avoids multi-cascade issues)
        builder.Property(a => a.NodeId).IsRequired();
        builder.Property(a => a.AnswerId).IsRequired();

        builder.Property(a => a.ScoreDeltas)
               .HasConversion(
                   v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                   v => string.IsNullOrWhiteSpace(v) ? new Dictionary<string, int>()
                        : JsonSerializer.Deserialize<Dictionary<string, int>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, int>(),
                   new ValueComparer<Dictionary<string, int>>(
                       (x, y) => x != null && y != null && x.Count == y.Count && !x.Except(y).Any(),
                       v => v.Aggregate(0, (h, kv) => HashCode.Combine(h, kv.Key.GetHashCode(), kv.Value.GetHashCode())),
                       v => new Dictionary<string, int>(v)))
               .HasColumnType("nvarchar(max)")
               .IsRequired();

        builder.HasIndex(a => a.ProgressId);
    }
}
