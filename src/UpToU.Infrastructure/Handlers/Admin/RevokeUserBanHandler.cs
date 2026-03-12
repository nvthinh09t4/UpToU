using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Admin;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Admin;

public class RevokeUserBanHandler : IRequestHandler<RevokeUserBanCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public RevokeUserBanHandler(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _userManager = userManager;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<bool>> Handle(RevokeUserBanCommand request, CancellationToken ct)
    {
        var adminId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (adminId is null)
            return Result<bool>.Unauthorized("Authentication required.");

        var ban = await _db.UserBans.FirstOrDefaultAsync(b => b.Id == request.BanId, ct);
        if (ban is null)
            return Result<bool>.NotFound("Ban not found.");

        if (ban.RevokedAt is not null)
            return Result<bool>.Conflict("Ban already revoked.");

        ban.RevokedAt = DateTime.UtcNow;
        ban.RevokedBy = adminId;

        var adminUser = await _userManager.FindByIdAsync(adminId);
        var adminName = adminUser is not null
            ? $"{adminUser.FirstName} {adminUser.LastName}".Trim()
            : "Admin";

        _db.Notifications.Add(new Core.Entities.Notification
        {
            RecipientId = ban.UserId,
            Type = "System",
            ActorName = adminName,
            Message = $"Your {ban.BanType.ToLower()} ban has been lifted. You now have full access again.",
        });

        await _db.SaveChangesAsync(ct);
        return Result<bool>.Success(true);
    }
}
