using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UpToU.Core.Entities;

namespace UpToU.Infrastructure.Data.Configurations;

public class CreditTransactionConfiguration : IEntityTypeConfiguration<CreditTransaction>
{
    public void Configure(EntityTypeBuilder<CreditTransaction> builder)
    {
        builder.HasKey(ct => ct.Id);

        builder.Property(ct => ct.UserId).IsRequired().HasMaxLength(450);
        builder.Property(ct => ct.Type).IsRequired().HasMaxLength(30);
        builder.Property(ct => ct.Description).HasMaxLength(500);

        builder.HasOne(ct => ct.User)
            .WithMany(u => u.CreditTransactions)
            .HasForeignKey(ct => ct.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ct => ct.Category)
            .WithMany()
            .HasForeignKey(ct => ct.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(ct => new { ct.UserId, ct.CreatedAt });
        builder.HasIndex(ct => new { ct.UserId, ct.Type, ct.CreatedAt });
        builder.HasIndex(ct => new { ct.CategoryId, ct.UserId });
    }
}
