using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryIdToCreditTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "CreditTransactions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CreditTransactions_CategoryId_UserId",
                table: "CreditTransactions",
                columns: new[] { "CategoryId", "UserId" });

            migrationBuilder.AddForeignKey(
                name: "FK_CreditTransactions_Categories_CategoryId",
                table: "CreditTransactions",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CreditTransactions_Categories_CategoryId",
                table: "CreditTransactions");

            migrationBuilder.DropIndex(
                name: "IX_CreditTransactions_CategoryId_UserId",
                table: "CreditTransactions");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "CreditTransactions");
        }
    }
}
