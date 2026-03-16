using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChoiceCountToStoryNodeAnswer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ChoiceCount",
                table: "StoryNodeAnswers",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChoiceCount",
                table: "StoryNodeAnswers");
        }
    }
}
