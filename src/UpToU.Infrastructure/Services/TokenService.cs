using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using UpToU.Core.Entities;
using UpToU.Core.Interfaces;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Options;

namespace UpToU.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly JwtOptions _jwtOptions;
    private readonly ApplicationDbContext _db;

    public TokenService(IOptions<JwtOptions> jwtOptions, ApplicationDbContext db)
    {
        _jwtOptions = jwtOptions.Value;
        _db = db;
    }

    public string GenerateAccessToken(ApplicationUser user, IList<string> roles)
    {
        var key = new SymmetricSecurityKey(Convert.FromBase64String(_jwtOptions.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email!),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("firstName", user.FirstName),
            new("lastName", user.LastName),
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtOptions.AccessTokenExpiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public RefreshToken GenerateRefreshToken(string userId)
    {
        return new RefreshToken
        {
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            UserId = userId,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenExpiryDays),
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<string?> ValidateRefreshTokenAsync(string token, CancellationToken ct)
    {
        var refreshToken = await _db.RefreshTokens
            .AsNoTracking()
            .FirstOrDefaultAsync(rt => rt.Token == token, ct);

        if (refreshToken is null || !refreshToken.IsActive)
            return null;

        return refreshToken.UserId;
    }
}
