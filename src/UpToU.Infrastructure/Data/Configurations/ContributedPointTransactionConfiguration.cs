using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class ContributedPointTransactionConfiguration
    : IEntityTypeConfiguration<ContributedPointTransaction>
{
    public void Configure(EntityTypeBuilder<ContributedPointTransaction> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.AuthorId).IsRequired().HasMaxLength(450);
        builder.Property(t => t.ReaderId).IsRequired().HasMaxLength(450);
        builder.Property(t => t.Points).HasDefaultValue(1);
        builder.Property(t => t.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(t => t.Story)
               .WithMany()
               .HasForeignKey(t => t.StoryId)
               .OnDelete(DeleteBehavior.Cascade);

        // Each reader can only award points once per story
        builder.HasIndex(t => new { t.StoryId, t.ReaderId }).IsUnique();

        builder.HasIndex(t => t.AuthorId);
        builder.HasIndex(t => t.CreatedAt);
    }
}
