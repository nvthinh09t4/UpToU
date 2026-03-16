using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryScoreTypesAndStoryTranslations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxScoreTypeId",
                table: "Stories",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxScoreValue",
                table: "Stories",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CategoryScoreTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Label = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ScoreWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    OrderToShow = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryScoreTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategoryScoreTypes_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StoryTranslations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StoryId = table.Column<int>(type: "int", nullable: false),
                    Language = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: true),
                    Excerpt = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedOn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoryTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoryTranslations_Stories_StoryId",
                        column: x => x.StoryId,
                        principalTable: "Stories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Stories_MaxScoreTypeId",
                table: "Stories",
                column: "MaxScoreTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_CategoryScoreTypes_CategoryId",
                table: "CategoryScoreTypes",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_CategoryScoreTypes_CategoryId_Name",
                table: "CategoryScoreTypes",
                columns: new[] { "CategoryId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CategoryScoreTypes_OrderToShow",
                table: "CategoryScoreTypes",
                column: "OrderToShow");

            migrationBuilder.CreateIndex(
                name: "IX_StoryTranslations_Language",
                table: "StoryTranslations",
                column: "Language");

            migrationBuilder.CreateIndex(
                name: "IX_StoryTranslations_StoryId_Language",
                table: "StoryTranslations",
                columns: new[] { "StoryId", "Language" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Stories_CategoryScoreTypes_MaxScoreTypeId",
                table: "Stories",
                column: "MaxScoreTypeId",
                principalTable: "CategoryScoreTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Stories_CategoryScoreTypes_MaxScoreTypeId",
                table: "Stories");

            migrationBuilder.DropTable(
                name: "CategoryScoreTypes");

            migrationBuilder.DropTable(
                name: "StoryTranslations");

            migrationBuilder.DropIndex(
                name: "IX_Stories_MaxScoreTypeId",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "MaxScoreTypeId",
                table: "Stories");

            migrationBuilder.DropColumn(
                name: "MaxScoreValue",
                table: "Stories");
        }
    }
}
