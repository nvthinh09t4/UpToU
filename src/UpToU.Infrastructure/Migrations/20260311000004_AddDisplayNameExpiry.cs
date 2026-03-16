using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using UpToU.Infrastructure.Data;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260311000004_AddDisplayNameExpiry")]
    public partial class AddDisplayNameExpiry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Conditional: safe for both fresh and existing databases.
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'[AspNetUsers]') AND name = N'DisplayNameExpiresAt')
                BEGIN
                    ALTER TABLE [AspNetUsers] ADD [DisplayNameExpiresAt] datetime2 NULL
                END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisplayNameExpiresAt",
                table: "AspNetUsers");
        }
    }
}
