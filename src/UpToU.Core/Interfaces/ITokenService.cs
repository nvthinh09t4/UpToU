using UpToU.Core.Entities;

namespace UpToU.Core.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(ApplicationUser user, IList<string> roles);
    RefreshToken GenerateRefreshToken(string userId);
    Task<string?> ValidateRefreshTokenAsync(string token, CancellationToken ct);
}
