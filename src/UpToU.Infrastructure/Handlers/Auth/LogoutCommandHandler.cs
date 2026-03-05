using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Auth;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Auth;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;

    public LogoutCommandHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Result<bool>> Handle(LogoutCommand request, CancellationToken ct)
    {
        var refreshToken = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, ct);

        if (refreshToken is not null && refreshToken.IsActive)
        {
            refreshToken.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        return Result<bool>.Success(true);
    }
}
