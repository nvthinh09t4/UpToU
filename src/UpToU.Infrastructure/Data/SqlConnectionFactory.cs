using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using UpToU.Core.Interfaces;
using UpToU.Infrastructure.Options;

namespace UpToU.Infrastructure.Data;

public class SqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public SqlConnectionFactory(IOptions<DatabaseOptions> options)
        => _connectionString = options.Value.ConnectionString;

    public async Task<IDbConnection> OpenAsync(CancellationToken ct = default)
    {
        var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        return conn;
    }
}
