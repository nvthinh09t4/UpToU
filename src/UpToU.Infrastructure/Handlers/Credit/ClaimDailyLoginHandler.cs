using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Credit;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Credit;

public class ClaimDailyLoginHandler : IRequestHandler<ClaimDailyLoginCommand, Result<CreditTransactionDto>>
{
    private const int DailyLoginReward = 10;

    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ClaimDailyLoginHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<CreditTransactionDto>> Handle(ClaimDailyLoginCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<CreditTransactionDto>.Unauthorized("Authentication required.");

        var todayUtc = DateTime.UtcNow.Date;

        var alreadyClaimed = await _db.CreditTransactions
            .AnyAsync(t => t.UserId == userId && t.Type == "DailyLogin" && t.CreatedAt >= todayUtc, ct);

        if (alreadyClaimed)
            return Result<CreditTransactionDto>.Conflict("Daily login reward already claimed today.");

        var user = await _db.Users.FirstAsync(u => u.Id == userId, ct);
        user.CreditBalance += DailyLoginReward;

        var transaction = new CreditTransaction
        {
            UserId = userId,
            Amount = DailyLoginReward,
            Type = "DailyLogin",
            Description = "Daily login bonus",
        };

        _db.CreditTransactions.Add(transaction);
        await _db.SaveChangesAsync(ct);

        return Result<CreditTransactionDto>.Success(new CreditTransactionDto(
            transaction.Id, transaction.Amount, transaction.Type,
            transaction.ReferenceId, transaction.Description, transaction.CreatedAt));
    }
}
