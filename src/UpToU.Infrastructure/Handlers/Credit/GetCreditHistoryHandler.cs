using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Credit;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Credit;

public class GetCreditHistoryHandler : IRequestHandler<GetCreditHistoryQuery, Result<CreditHistoryDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public GetCreditHistoryHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<CreditHistoryDto>> Handle(GetCreditHistoryQuery request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<CreditHistoryDto>.Unauthorized("Authentication required.");

        var query = _db.CreditTransactions
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt);

        var totalCount = await query.CountAsync(ct);

        var transactions = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new CreditTransactionDto(
                t.Id, t.Amount, t.Type, t.ReferenceId, t.Description, t.CreatedAt))
            .ToListAsync(ct);

        var user = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.CreditBalance)
            .FirstAsync(ct);

        return Result<CreditHistoryDto>.Success(new CreditHistoryDto(user, transactions, totalCount));
    }
}
