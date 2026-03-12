using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddContributedPoints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssignedSupervisorId",
                table: "Stories",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AuthorId",
                table: "Stories",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Stories",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "Stories",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewedBy",
                table: "Stories",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Stories",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Draft");

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "Stories",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsExclusive",
                table: "RewardItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ContributedPoints",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ContributedPointTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AuthorId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    ReaderId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    StoryId = table.Column<int>(type: "int", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContributedPointTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContributedPointTransactions_Stories_StoryId",
                        column: x => x.StoryId,
                        principalTable: "Stories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Stories_AssignedSupervisorId",
                table: "Stories",
                column: "AssignedSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_Stories_AuthorId",
                table: "Stories",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Stories_Status",
                table: "Stories",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ContributedPointTransactions_AuthorId",
                table: "ContributedPointTransactions",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_ContributedPointTransactions_CreatedAt",
                table: "ContributedPointTransactions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ContributedPointTransactions_StoryId_ReaderId",
                table: "ContributedPointTransactions",
                columns: new[] { "StoryId", "ReaderId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContributedPointTransactions");

            migrationBuilder.DropIndex(
                name: "IX_Stories_AssignedSupervisorId",
                table: "Stories");

            migrationBuilder.DropIndex(
                name: "IX_Stories_AuthorId",
                table: "Stories");

            migrationBuilder.DropIndex(
                name: "IX_Stories_Status",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "AssignedSupervisorId",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "AuthorId",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "ReviewedBy",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "IsExclusive",
                table: "RewardItems");

            migrationBuilder.DropColumn(
                name: "ContributedPoints",
                table: "AspNetUsers");
        }
    }
}
