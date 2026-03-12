using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Admin;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Admin;

public class BanUserHandler : IRequestHandler<BanUserCommand, Result<UserBanDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public BanUserHandler(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _userManager = userManager;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<UserBanDto>> Handle(BanUserCommand request, CancellationToken ct)
    {
        var adminId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (adminId is null)
            return Result<UserBanDto>.Unauthorized("Authentication required.");

        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user is null)
            return Result<UserBanDto>.NotFound("User not found.");

        if (request.BanType != "Global" && request.BanType != "Category")
            return Result<UserBanDto>.Failure("BanType must be 'Global' or 'Category'.");

        string? categoryTitle = null;
        if (request.BanType == "Category")
        {
            if (request.CategoryId is null)
                return Result<UserBanDto>.Failure("CategoryId is required for category restrictions.");

            var cat = await _db.Categories.AsNoTracking()
                .Where(c => c.Id == request.CategoryId && !c.IsDeleted)
                .Select(c => new { c.Title })
                .FirstOrDefaultAsync(ct);

            if (cat is null)
                return Result<UserBanDto>.NotFound("Category not found.");

            categoryTitle = cat.Title;
        }

        var adminUser = await _userManager.FindByIdAsync(adminId);
        var adminName = adminUser is not null
            ? $"{adminUser.FirstName} {adminUser.LastName}".Trim()
            : "Admin";

        var ban = new UserBan
        {
            UserId = request.UserId,
            BanType = request.BanType,
            CategoryId = request.CategoryId,
            Reason = request.Reason,
            IssuedBy = adminId,
            ExpiresAt = request.DurationDays.HasValue
                ? DateTime.UtcNow.AddDays(request.DurationDays.Value)
                : null,
        };

        _db.UserBans.Add(ban);

        // Create notification for the user
        var notificationType = request.BanType == "Global" ? "Ban" : "Restrict";
        var duration = request.DurationDays.HasValue
            ? $"for {request.DurationDays} days"
            : "permanently";
        var scope = request.BanType == "Category"
            ? $" from category \"{categoryTitle}\""
            : "";

        var message = $"You have been {notificationType.ToLower()}ed{scope} {duration}. Reason: {request.Reason}";

        _db.Notifications.Add(new Core.Entities.Notification
        {
            RecipientId = request.UserId,
            Type = notificationType,
            ActorName = adminName,
            Message = message,
            IsImportant = true,
        });

        await _db.SaveChangesAsync(ct);

        return Result<UserBanDto>.Success(new UserBanDto(
            ban.Id, ban.UserId, user.Email!, $"{user.FirstName} {user.LastName}",
            ban.BanType, ban.CategoryId, categoryTitle, ban.Reason,
            adminName, ban.IssuedAt, ban.ExpiresAt, ban.RevokedAt, ban.RevokedBy,
            ban.IsActive
        ));
    }
}
