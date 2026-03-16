using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Core.Commands.Streak;
using UpToU.Core.DTOs.Streak;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Extensions;

namespace UpToU.Infrastructure.Handlers.Streak;

public class GetUserStreakHandler : IRequestHandler<GetUserStreakQuery, Result<StreakDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _http;
    private readonly ILogger<GetUserStreakHandler> _logger;

    private static readonly int[] Milestones = [3, 7, 30];

    public GetUserStreakHandler(ApplicationDbContext db, IHttpContextAccessor http, ILogger<GetUserStreakHandler> logger)
    {
        _db     = db;
        _http   = http;
        _logger = logger;
    }

    public async Task<Result<StreakDto>> Handle(GetUserStreakQuery request, CancellationToken ct)
    {
        var userId = _http.GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Result<StreakDto>.Unauthorized("Authentication required.");

        var streak = await _db.UserStreaks
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        var current = streak?.CurrentStreak ?? 0;
        var longest = streak?.LongestStreak ?? 0;
        var lastDate = streak?.LastCompletionDate;

        var nextMilestone = Milestones.FirstOrDefault(m => m > current);
        var creditsAtNext = nextMilestone switch { 3 => 30, 7 => 75, 30 => 300, _ => 0 };

        return Result<StreakDto>.Success(new StreakDto(current, longest, lastDate, nextMilestone, creditsAtNext));
    }
}
