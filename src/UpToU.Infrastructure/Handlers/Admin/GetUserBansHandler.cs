using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Admin;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Admin;

public class GetUserBansHandler : IRequestHandler<GetUserBansQuery, Result<List<UserBanDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetUserBansHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<UserBanDto>>> Handle(GetUserBansQuery request, CancellationToken ct)
    {
        var query = _db.UserBans.AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.Category)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.UserId))
            query = query.Where(b => b.UserId == request.UserId);

        var bans = await query
            .OrderByDescending(b => b.IssuedAt)
            .Select(b => new UserBanDto(
                b.Id,
                b.UserId,
                b.User.Email!,
                (b.User.FirstName + " " + b.User.LastName).Trim(),
                b.BanType,
                b.CategoryId,
                b.Category != null ? b.Category.Title : null,
                b.Reason,
                b.IssuedBy,
                b.IssuedAt,
                b.ExpiresAt,
                b.RevokedAt,
                b.RevokedBy,
                b.RevokedAt == null && (b.ExpiresAt == null || b.ExpiresAt > DateTime.UtcNow)
            ))
            .ToListAsync(ct);

        return Result<List<UserBanDto>>.Success(bans);
    }
}
