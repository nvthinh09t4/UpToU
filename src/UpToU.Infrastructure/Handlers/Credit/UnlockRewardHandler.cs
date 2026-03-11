using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Credit;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Core.Services;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Credit;

public class UnlockRewardHandler : IRequestHandler<UnlockRewardCommand, Result<CreditBalanceDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UnlockRewardHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<CreditBalanceDto>> Handle(UnlockRewardCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<CreditBalanceDto>.Unauthorized("Authentication required.");

        var reward = await _db.RewardItems.FirstOrDefaultAsync(r => r.Id == request.RewardItemId && r.IsActive, ct);
        if (reward is null)
            return Result<CreditBalanceDto>.NotFound("Reward not found.");

        var alreadyUnlocked = await _db.UserRewards
            .AnyAsync(ur => ur.UserId == userId && ur.RewardItemId == request.RewardItemId, ct);
        if (alreadyUnlocked)
            return Result<CreditBalanceDto>.Conflict("Reward already unlocked.");

        var user = await _db.Users.FirstAsync(u => u.Id == userId, ct);
        if (user.CreditBalance < reward.CreditCost)
            return Result<CreditBalanceDto>.Failure("Insufficient credits.");

        user.CreditBalance -= reward.CreditCost;

        _db.CreditTransactions.Add(new CreditTransaction
        {
            UserId = userId,
            Amount = -reward.CreditCost,
            Type = "RewardUnlock",
            ReferenceId = reward.Id,
            Description = $"Unlocked: {reward.Name}",
        });

        _db.UserRewards.Add(new UserReward
        {
            UserId = userId,
            RewardItemId = reward.Id,
        });

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
