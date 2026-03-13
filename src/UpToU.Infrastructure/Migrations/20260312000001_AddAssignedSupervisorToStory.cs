using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using UpToU.Infrastructure.Data;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260312000001_AddAssignedSupervisorToStory")]
    public partial class AddAssignedSupervisorToStory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Conditional: safe for both fresh and existing databases.
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'[Stories]') AND name = N'AssignedSupervisorId')
                BEGIN
                    ALTER TABLE [Stories] ADD [AssignedSupervisorId] nvarchar(450) NULL
                END;

                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE object_id = OBJECT_ID(N'[Stories]') AND name = N'IX_Stories_AssignedSupervisorId')
                BEGIN
                    CREATE INDEX [IX_Stories_AssignedSupervisorId] ON [Stories] ([AssignedSupervisorId])
                END;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Stories_AssignedSupervisorId",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "AssignedSupervisorId",
                table: "Stories");
        }
    }
}
