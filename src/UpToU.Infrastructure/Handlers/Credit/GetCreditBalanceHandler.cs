using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Credit;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Core.Services;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Credit;

public class GetCreditBalanceHandler : IRequestHandler<GetCreditBalanceQuery, Result<CreditBalanceDto>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ApplicationDbContext _db;

    public GetCreditBalanceHandler(
        UserManager<ApplicationUser> userManager,
        IHttpContextAccessor httpContextAccessor,
        ApplicationDbContext db)
    {
        _userManager = userManager;
        _httpContextAccessor = httpContextAccessor;
        _db = db;
    }

    public async Task<Result<CreditBalanceDto>> Handle(GetCreditBalanceQuery request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<CreditBalanceDto>.Unauthorized("Authentication required.");

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Result<CreditBalanceDto>.NotFound("User not found.");

        var allTimeEarned = await _db.CreditTransactions
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.Amount > 0)
            .SumAsync(t => t.Amount, ct);

        var rank = RankHelper.GetRank(allTimeEarned);

        return Result<CreditBalanceDto>.Success(new CreditBalanceDto(
            user.CreditBalance,
            user.ActiveTitle,
            user.ActiveAvatarFrameUrl,
            user.AvatarUrl,
            allTimeEarned,
            rank.Name,
            rank.Stars
        ));
    }
}
