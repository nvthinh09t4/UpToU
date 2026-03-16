using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using UpToU.Infrastructure.Data;

#nullable disable

namespace UpToU.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260311000005_AddStoryWorkflowFields")]
    public partial class AddStoryWorkflowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // All AddColumn and CreateIndex calls are conditional so this migration
            // is safe to apply against databases that already have these columns
            // (e.g. from a previous version of AddContributedPoints).
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Stories]') AND name = N'AuthorId')
                    ALTER TABLE [Stories] ADD [AuthorId] nvarchar(450) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Stories]') AND name = N'Status')
                    ALTER TABLE [Stories] ADD [Status] nvarchar(20) NOT NULL DEFAULT 'Draft';

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Stories]') AND name = N'SubmittedAt')
                    ALTER TABLE [Stories] ADD [SubmittedAt] datetime2 NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Stories]') AND name = N'ReviewedBy')
                    ALTER TABLE [Stories] ADD [ReviewedBy] nvarchar(450) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Stories]') AND name = N'ReviewedAt')
                    ALTER TABLE [Stories] ADD [ReviewedAt] datetime2 NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Stories]') AND name = N'RejectionReason')
                    ALTER TABLE [Stories] ADD [RejectionReason] nvarchar(2000) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[Stories]') AND name = N'IX_Stories_Status')
                    CREATE INDEX [IX_Stories_Status] ON [Stories] ([Status]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[Stories]') AND name = N'IX_Stories_AuthorId')
                    CREATE INDEX [IX_Stories_AuthorId] ON [Stories] ([AuthorId]);");
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
