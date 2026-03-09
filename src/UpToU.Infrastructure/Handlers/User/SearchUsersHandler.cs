using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.User;
using UpToU.Core.DTOs.User;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.User;

public class SearchUsersHandler : IRequestHandler<SearchUsersQuery, Result<List<UserMentionDto>>>
{
    private readonly ApplicationDbContext _db;

    public SearchUsersHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<UserMentionDto>>> Handle(SearchUsersQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Prefix) || request.Prefix.Length < 1)
            return Result<List<UserMentionDto>>.Success(new List<UserMentionDto>());

        var prefix = request.Prefix.ToLower();
        var users = await _db.Users
            .AsNoTracking()
            .Where(u => u.MentionHandle != null && u.MentionHandle.StartsWith(prefix))
            .OrderBy(u => u.MentionHandle)
            .Take(5)
            .Select(u => new UserMentionDto(
                u.Id,
                u.MentionHandle!,
                $"{u.FirstName} {u.LastName}"))
            .ToListAsync(ct);

        return Result<List<UserMentionDto>>.Success(users);
    }
}
