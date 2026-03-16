using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddScoreDeltasAndViTranslations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ScoreTotals",
                table: "UserStoryProgresses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ScoreDeltas",
                table: "UserStoryAnswers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "QuestionSubtitleVi",
                table: "StoryNodes",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QuestionVi",
                table: "StoryNodes",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScoreDeltas",
                table: "StoryNodeAnswers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TextVi",
                table: "StoryNodeAnswers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScoreTotals",
                table: "UserStoryProgresses");

            migrationBuilder.DropColumn(
                name: "ScoreDeltas",
                table: "UserStoryAnswers");

            migrationBuilder.DropColumn(
                name: "QuestionSubtitleVi",
                table: "StoryNodes");

            migrationBuilder.DropColumn(
                name: "QuestionVi",
                table: "StoryNodes");

            migrationBuilder.DropColumn(
                name: "ScoreDeltas",
                table: "StoryNodeAnswers");

            migrationBuilder.DropColumn(
                name: "TextVi",
                table: "StoryNodeAnswers");
        }
    }
}
