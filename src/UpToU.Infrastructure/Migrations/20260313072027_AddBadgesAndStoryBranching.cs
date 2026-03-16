using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBadgesAndStoryBranching : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BranchWeights",
                table: "StoryNodeAnswers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Feedback",
                table: "StoryNodeAnswers",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FeedbackVi",
                table: "StoryNodeAnswers",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxQuestionLimit",
                table: "Stories",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CategoryBadges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    Tier = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    LabelVi = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ScoreThreshold = table.Column<int>(type: "int", nullable: false),
                    BadgeImageUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryBadges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategoryBadges_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserCategoryBadges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BadgeId = table.Column<int>(type: "int", nullable: false),
                    AwardedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCategoryBadges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserCategoryBadges_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserCategoryBadges_CategoryBadges_BadgeId",
                        column: x => x.BadgeId,
                        principalTable: "CategoryBadges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CategoryBadges_CategoryId",
                table: "CategoryBadges",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_CategoryBadges_CategoryId_Tier",
                table: "CategoryBadges",
                columns: new[] { "CategoryId", "Tier" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserCategoryBadges_BadgeId",
                table: "UserCategoryBadges",
                column: "BadgeId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCategoryBadges_UserId",
                table: "UserCategoryBadges",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCategoryBadges_UserId_BadgeId",
                table: "UserCategoryBadges",
                columns: new[] { "UserId", "BadgeId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserCategoryBadges");

            migrationBuilder.DropTable(
                name: "CategoryBadges");

            migrationBuilder.DropColumn(
                name: "BranchWeights",
                table: "StoryNodeAnswers");

            migrationBuilder.DropColumn(
                name: "Feedback",
                table: "StoryNodeAnswers");

            migrationBuilder.DropColumn(
                name: "FeedbackVi",
                table: "StoryNodeAnswers");

            migrationBuilder.DropColumn(
                name: "MaxQuestionLimit",
                table: "Stories");
        }
    }
}
