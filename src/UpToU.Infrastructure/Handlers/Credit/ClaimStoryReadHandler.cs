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

public class ClaimStoryReadHandler : IRequestHandler<ClaimStoryReadCommand, Result<CreditTransactionDto>>
{
    private const int StoryReadReward = 5;

    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ClaimStoryReadHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<CreditTransactionDto>> Handle(ClaimStoryReadCommand request, CancellationToken ct)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<CreditTransactionDto>.Unauthorized("Authentication required.");

        var story = await _db.Stories
            .AsNoTracking()
            .Where(s => s.Id == request.StoryId && !s.IsDeleted)
            .Select(s => new { s.Id, s.CategoryId })
            .FirstOrDefaultAsync(ct);

        if (story is null)
            return Result<CreditTransactionDto>.NotFound("Story not found.");

        // One reward per story per user
        var alreadyClaimed = await _db.CreditTransactions
            .AnyAsync(t => t.UserId == userId && t.Type == "StoryRead" && t.ReferenceId == request.StoryId, ct);

        if (alreadyClaimed)
            return Result<CreditTransactionDto>.Conflict("Credits for this story already claimed.");

        var user = await _db.Users.FirstAsync(u => u.Id == userId, ct);
        user.CreditBalance += StoryReadReward;

        var transaction = new CreditTransaction
        {
            UserId = userId,
            Amount = StoryReadReward,
            Type = "StoryRead",
            ReferenceId = request.StoryId,
            CategoryId = story.CategoryId,
            Description = "Finished reading a story",
        };

        _db.CreditTransactions.Add(transaction);
        await _db.SaveChangesAsync(ct);

        return Result<CreditTransactionDto>.Success(new CreditTransactionDto(
            transaction.Id, transaction.Amount, transaction.Type,
            transaction.ReferenceId, transaction.Description, transaction.CreatedAt));
    }
}
