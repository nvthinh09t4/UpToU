using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.Property(n => n.RecipientId)
               .HasMaxLength(450)
               .IsRequired();

        builder.Property(n => n.Type)
               .HasMaxLength(20)
               .IsRequired();

        builder.Property(n => n.ActorName)
               .HasMaxLength(200)
               .IsRequired();

        builder.Property(n => n.Message)
               .HasMaxLength(2000)
               .IsRequired(false);

        builder.HasOne(n => n.Recipient)
               .WithMany(u => u.Notifications)
               .HasForeignKey(n => n.RecipientId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(n => new { n.RecipientId, n.IsRead });
        builder.HasIndex(n => new { n.RecipientId, n.IsArchived });
        builder.HasIndex(n => new { n.RecipientId, n.IsImportant });
        builder.HasIndex(n => n.RecipientId);
    }
}
