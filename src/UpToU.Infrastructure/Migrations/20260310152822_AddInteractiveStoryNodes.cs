using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInteractiveStoryNodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EffectiveDate",
                table: "StoryDetails",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StoryType",
                table: "Stories",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Article");

            migrationBuilder.CreateTable(
                name: "StoryNodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StoryDetailId = table.Column<int>(type: "int", nullable: false),
                    Question = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    QuestionSubtitle = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsStart = table.Column<bool>(type: "bit", nullable: false),
                    BackgroundImageUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    BackgroundColor = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    VideoUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AnimationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoryNodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoryNodes_StoryDetails_StoryDetailId",
                        column: x => x.StoryDetailId,
                        principalTable: "StoryDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StoryNodeAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StoryNodeId = table.Column<int>(type: "int", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PointsAwarded = table.Column<int>(type: "int", nullable: false),
                    NextNodeId = table.Column<int>(type: "int", nullable: true),
                    Color = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoryNodeAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoryNodeAnswers_StoryNodes_NextNodeId",
                        column: x => x.NextNodeId,
                        principalTable: "StoryNodes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StoryNodeAnswers_StoryNodes_StoryNodeId",
                        column: x => x.StoryNodeId,
                        principalTable: "StoryNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserStoryProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StoryId = table.Column<int>(type: "int", nullable: false),
                    StoryDetailId = table.Column<int>(type: "int", nullable: false),
                    CurrentNodeId = table.Column<int>(type: "int", nullable: true),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    TotalPointsEarned = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserStoryProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserStoryProgresses_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserStoryProgresses_Stories_StoryId",
                        column: x => x.StoryId,
                        principalTable: "Stories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserStoryProgresses_StoryDetails_StoryDetailId",
                        column: x => x.StoryDetailId,
                        principalTable: "StoryDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserStoryProgresses_StoryNodes_CurrentNodeId",
                        column: x => x.CurrentNodeId,
                        principalTable: "StoryNodes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserStoryAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProgressId = table.Column<int>(type: "int", nullable: false),
                    NodeId = table.Column<int>(type: "int", nullable: false),
                    AnswerId = table.Column<int>(type: "int", nullable: false),
                    PointsAwarded = table.Column<int>(type: "int", nullable: false),
                    AnsweredAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserStoryAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserStoryAnswers_UserStoryProgresses_ProgressId",
                        column: x => x.ProgressId,
                        principalTable: "UserStoryProgresses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StoryDetails_StoryId_EffectiveDate",
                table: "StoryDetails",
                columns: new[] { "StoryId", "EffectiveDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Stories_StoryType",
                table: "Stories",
                column: "StoryType");

            migrationBuilder.CreateIndex(
                name: "IX_StoryNodeAnswers_NextNodeId",
                table: "StoryNodeAnswers",
                column: "NextNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_StoryNodeAnswers_StoryNodeId",
                table: "StoryNodeAnswers",
                column: "StoryNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_StoryNodes_StoryDetailId",
                table: "StoryNodes",
                column: "StoryDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_StoryNodes_StoryDetailId_IsStart",
                table: "StoryNodes",
                columns: new[] { "StoryDetailId", "IsStart" });

            migrationBuilder.CreateIndex(
                name: "IX_UserStoryAnswers_ProgressId",
                table: "UserStoryAnswers",
                column: "ProgressId");

            migrationBuilder.CreateIndex(
                name: "IX_UserStoryProgresses_CurrentNodeId",
                table: "UserStoryProgresses",
                column: "CurrentNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_UserStoryProgresses_StoryDetailId",
                table: "UserStoryProgresses",
                column: "StoryDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_UserStoryProgresses_StoryId",
                table: "UserStoryProgresses",
                column: "StoryId");

            migrationBuilder.CreateIndex(
                name: "IX_UserStoryProgresses_UserId",
                table: "UserStoryProgresses",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserStoryProgresses_UserId_StoryId",
                table: "UserStoryProgresses",
                columns: new[] { "UserId", "StoryId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StoryNodeAnswers");

            migrationBuilder.DropTable(
                name: "UserStoryAnswers");

            migrationBuilder.DropTable(
                name: "UserStoryProgresses");

            migrationBuilder.DropTable(
                name: "StoryNodes");

            migrationBuilder.DropIndex(
                name: "IX_StoryDetails_StoryId_EffectiveDate",
                table: "StoryDetails");

            migrationBuilder.DropIndex(
                name: "IX_Stories_StoryType",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "EffectiveDate",
                table: "StoryDetails");

            migrationBuilder.DropColumn(
                name: "StoryType",
                table: "Stories");
        }
    }
}
