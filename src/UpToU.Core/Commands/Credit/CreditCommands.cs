using MediatR;
using UpToU.Core.DTOs.Credit;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Credit;

public record GetCreditBalanceQuery() : IRequest<Result<CreditBalanceDto>>;

public record GetCreditHistoryQuery(int Page = 1, int PageSize = 20) : IRequest<Result<CreditHistoryDto>>;

public record GetRewardsQuery(string? Category = null) : IRequest<Result<List<RewardItemDto>>>;

public record UnlockRewardCommand(int RewardItemId) : IRequest<Result<CreditBalanceDto>>;

public record SetActiveRewardCommand(int RewardItemId, bool Activate) : IRequest<Result<CreditBalanceDto>>;

public record ClaimDailyLoginCommand() : IRequest<Result<CreditTransactionDto>>;

public record ClaimStoryReadCommand(int StoryId) : IRequest<Result<CreditTransactionDto>>;

public record GetAdminRewardsQuery(string? Category = null) : IRequest<Result<List<AdminRewardItemDto>>>;

public record CreateRewardItemCommand(
    string Name,
    string? Description,
    string Category,
    int CreditCost,
    string? Value,
    string? PreviewUrl
) : IRequest<Result<AdminRewardItemDto>>;

public record UpdateRewardItemCommand(
    int Id,
    string Name,
    string? Description,
    string Category,
    int CreditCost,
    string? Value,
    string? PreviewUrl,
    bool IsActive
) : IRequest<Result<AdminRewardItemDto>>;

public record DeleteRewardItemCommand(int Id) : IRequest<Result<bool>>;
