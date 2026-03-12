using Microsoft.EntityFrameworkCore;
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

        builder.HasIndex(a => a.ProgressId);
    }
}
