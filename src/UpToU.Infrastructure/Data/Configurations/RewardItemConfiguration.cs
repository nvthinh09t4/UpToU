using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class RewardItemConfiguration : IEntityTypeConfiguration<RewardItem>
{
    public void Configure(EntityTypeBuilder<RewardItem> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Name).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Description).HasMaxLength(500);
        builder.Property(r => r.Category).IsRequired().HasMaxLength(30);
        builder.Property(r => r.Value).HasMaxLength(500);
        builder.Property(r => r.PreviewUrl).HasMaxLength(500);

        builder.HasIndex(r => r.Category);
    }
}
