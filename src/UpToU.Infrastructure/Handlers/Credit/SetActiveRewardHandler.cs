using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Credit;
using UpToU.Core.Models;
using UpToU.Core.Services;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Credit;

public class SetActiveRewardHandler : IRequestHandler<SetActiveRewardCommand, Result<CreditBalanceDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public SetActiveRewardHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<CreditBalanceDto>> Handle(SetActiveRewardCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<CreditBalanceDto>.Unauthorized("Authentication required.");

        var userReward = await _db.UserRewards
            .Include(ur => ur.RewardItem)
            .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RewardItemId == request.RewardItemId, ct);
        if (userReward is null)
            return Result<CreditBalanceDto>.NotFound("Reward not unlocked.");

        var category = userReward.RewardItem.Category;

        // Deactivate all rewards of the same category for this user
        var sameCategory = await _db.UserRewards
            .Include(ur => ur.RewardItem)
            .Where(ur => ur.UserId == userId && ur.RewardItem.Category == category && ur.IsActive)
            .ToListAsync(ct);

        foreach (var r in sameCategory)
            r.IsActive = false;

        // Activate the requested reward if toggling on
        userReward.IsActive = request.Activate;

        // Update user profile fields based on category
        var user = await _db.Users.FirstAsync(u => u.Id == userId, ct);

        if (category == "Title")
            user.ActiveTitle = request.Activate ? userReward.RewardItem.Value : null;
        else if (category == "AvatarFrame")
            user.ActiveAvatarFrameUrl = request.Activate ? userReward.RewardItem.Value : null;
        else if (category == "Avatar")
            user.AvatarUrl = request.Activate ? userReward.RewardItem.Value : null;

        await _db.SaveChangesAsync(ct);

        var allTimeEarned = await _db.CreditTransactions
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.Amount > 0)
            .SumAsync(t => t.Amount, ct);
        var rank = RankHelper.GetRank(allTimeEarned);

        return Result<CreditBalanceDto>.Success(new CreditBalanceDto(
            user.CreditBalance, user.ActiveTitle, user.ActiveAvatarFrameUrl, user.AvatarUrl,
            allTimeEarned, rank.Name, rank.Stars));
    }
}
