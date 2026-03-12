using System.Data;

namespace UpToU.Core.Interfaces;

/// <summary>
/// Creates open database connections from the pool.
/// Each call returns a new connection — safe to use concurrently.
/// </summary>
public interface IDbConnectionFactory
{
    Task<IDbConnection> OpenAsync(CancellationToken ct = default);
}
