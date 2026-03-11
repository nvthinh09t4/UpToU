using MediatR;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Admin;

public record BanUserCommand(
    string UserId,
    string BanType,
    int? CategoryId,
    string Reason,
    int? DurationDays
) : IRequest<Result<UserBanDto>>;

public record RevokeUserBanCommand(int BanId) : IRequest<Result<bool>>;

public record GetUserBansQuery(string? UserId = null) : IRequest<Result<List<UserBanDto>>>;
