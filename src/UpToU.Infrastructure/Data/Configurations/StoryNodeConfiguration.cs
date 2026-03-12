using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class StoryNodeConfiguration : IEntityTypeConfiguration<StoryNode>
{
    public void Configure(EntityTypeBuilder<StoryNode> builder)
    {
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Question).HasMaxLength(2000).IsRequired();
        builder.Property(n => n.QuestionSubtitle).HasMaxLength(500);
        builder.Property(n => n.BackgroundImageUrl).HasMaxLength(2000);
        builder.Property(n => n.BackgroundColor).HasMaxLength(50);
        builder.Property(n => n.VideoUrl).HasMaxLength(2000);
        builder.Property(n => n.AnimationType).HasMaxLength(50);

        builder.HasOne(n => n.StoryDetail)
            .WithMany(d => d.StoryNodes)
            .HasForeignKey(n => n.StoryDetailId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(n => n.StoryDetailId);
        builder.HasIndex(n => new { n.StoryDetailId, n.IsStart });
    }
}
