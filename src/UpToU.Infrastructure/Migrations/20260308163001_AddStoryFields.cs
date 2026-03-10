using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStoryFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChangeNotes",
                table: "StoryDetails",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "StoryDetails",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublish",
                table: "StoryDetails",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "WordCount",
                table: "StoryDetails",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "AuthorName",
                table: "Stories",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoverImageUrl",
                table: "Stories",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Excerpt",
                table: "Stories",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "Stories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Stories",
                type: "nvarchar(600)",
                maxLength: 600,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StoryDetails_IsPublish",
                table: "StoryDetails",
                column: "IsPublish");

            migrationBuilder.CreateIndex(
                name: "IX_Stories_Slug",
                table: "Stories",
                column: "Slug",
                unique: true,
                filter: "[Slug] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StoryDetails_IsPublish",
                table: "StoryDetails");

            migrationBuilder.DropIndex(
                name: "IX_Stories_Slug",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "ChangeNotes",
                table: "StoryDetails");

            migrationBuilder.DropColumn(
                name: "Content",
                table: "StoryDetails");

            migrationBuilder.DropColumn(
                name: "IsPublish",
                table: "StoryDetails");

            migrationBuilder.DropColumn(
                name: "WordCount",
                table: "StoryDetails");

            migrationBuilder.DropColumn(
                name: "AuthorName",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "CoverImageUrl",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "Excerpt",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Stories");
        }
    }
}
