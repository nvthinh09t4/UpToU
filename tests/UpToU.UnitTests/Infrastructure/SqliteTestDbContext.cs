using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using UpToU.Infrastructure.Data;

namespace UpToU.UnitTests.Infrastructure;

/// <summary>
/// Creates an ApplicationDbContext backed by an in-memory SQLite connection.
/// The context subclass omits SQL Server-specific column type annotations so that
/// EnsureCreated() succeeds with SQLite.
/// </summary>
public static class SqliteTestDbContextFactory
{
    public static (ApplicationDbContext db, SqliteConnection conn) Create()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;

        var db = new SqliteApplicationDbContext(options);
        db.Database.EnsureCreated();
        return (db, connection);
    }
}

/// <summary>
/// ApplicationDbContext subclass that overrides OnModelCreating to skip
/// SQL Server-specific HasColumnType calls (nvarchar(max), decimal(18,x))
/// that are incompatible with SQLite's EnsureCreated.
/// </summary>
internal class SqliteApplicationDbContext : ApplicationDbContext
{
    public SqliteApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    protected override void OnModelCreating(Microsoft.EntityFrameworkCore.ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Strip SQL Server-specific column type constraints that break SQLite
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                var columnType = property.GetColumnType();
                if (columnType != null &&
                    (columnType.Contains("nvarchar(max)", StringComparison.OrdinalIgnoreCase) ||
                     columnType.Contains("decimal(", StringComparison.OrdinalIgnoreCase)))
                {
                    property.SetColumnType(null);
                }
            }
        }
    }
}
