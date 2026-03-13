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
            // NOTE: AuthorId, Status, SubmittedAt, ReviewedBy, ReviewedAt, RejectionReason
            // were already added by 20260311000005_AddStoryWorkflowFields.
            // AssignedSupervisorId and IX_Stories_AssignedSupervisorId were already added
            // by 20260312000001_AddAssignedSupervisorToStory.
            // Those AddColumn / CreateIndex calls have been removed to avoid duplicate-column errors.

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

            migrationBuilder.DropColumn(
                name: "IsExclusive",
                table: "RewardItems");

            migrationBuilder.DropColumn(
                name: "ContributedPoints",
                table: "AspNetUsers");
        }
    }
}
