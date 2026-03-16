using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class UserStoryProgressConfiguration : IEntityTypeConfiguration<UserStoryProgress>
{
    public void Configure(EntityTypeBuilder<UserStoryProgress> builder)
    {
        builder.HasKey(p => p.Id);

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Story)
            .WithMany()
            .HasForeignKey(p => p.StoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.StoryDetail)
            .WithMany()
            .HasForeignKey(p => p.StoryDetailId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.CurrentNode)
            .WithMany()
            .HasForeignKey(p => p.CurrentNodeId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .IsRequired(false);

        builder.Property(p => p.ScoreTotals)
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

        // One progress record per user per story
        builder.HasIndex(p => new { p.UserId, p.StoryId }).IsUnique();
        builder.HasIndex(p => p.UserId);
        builder.HasIndex(p => p.StoryId);
    }
}
