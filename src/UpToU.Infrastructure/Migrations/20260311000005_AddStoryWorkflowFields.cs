using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStoryWorkflowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(name: "AuthorId",       table: "Stories", type: "nvarchar(450)", nullable: true);
            migrationBuilder.AddColumn<string>(name: "Status",         table: "Stories", type: "nvarchar(20)",  nullable: false, defaultValue: "Draft");
            migrationBuilder.AddColumn<DateTime>(name: "SubmittedAt",  table: "Stories", type: "datetime2",     nullable: true);
            migrationBuilder.AddColumn<string>(name: "ReviewedBy",     table: "Stories", type: "nvarchar(450)", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "ReviewedAt",   table: "Stories", type: "datetime2",     nullable: true);
            migrationBuilder.AddColumn<string>(name: "RejectionReason", table: "Stories", type: "nvarchar(2000)", nullable: true);
            migrationBuilder.CreateIndex(name: "IX_Stories_Status",   table: "Stories", column: "Status");
            migrationBuilder.CreateIndex(name: "IX_Stories_AuthorId", table: "Stories", column: "AuthorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Stories_Status",   table: "Stories");
            migrationBuilder.DropIndex(name: "IX_Stories_AuthorId", table: "Stories");
            migrationBuilder.DropColumn(name: "AuthorId",        table: "Stories");
            migrationBuilder.DropColumn(name: "Status",          table: "Stories");
            migrationBuilder.DropColumn(name: "SubmittedAt",     table: "Stories");
            migrationBuilder.DropColumn(name: "ReviewedBy",      table: "Stories");
            migrationBuilder.DropColumn(name: "ReviewedAt",      table: "Stories");
            migrationBuilder.DropColumn(name: "RejectionReason", table: "Stories");
        }
    }
}
