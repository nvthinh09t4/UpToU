namespace UpToU.Core.DTOs.Credit;

public record CreditBalanceDto(
    int Balance,
    string? ActiveTitle,
    string? ActiveAvatarFrameUrl,
    string? AvatarUrl,
    int TotalCreditsEarned,
    string RankName,
    int RankStars
);

public record CreditTransactionDto(
    long Id,
    int Amount,
    string Type,
    int? ReferenceId,
    string? Description,
    DateTime CreatedAt
);

public record RewardItemDto(
    int Id,
    string Name,
    string? Description,
    string Category,
    int CreditCost,
    string? Value,
    string? PreviewUrl,
    bool IsUnlocked,
    bool IsActive
);

public record CreditHistoryDto(
    int Balance,
    List<CreditTransactionDto> Transactions,
    int TotalCount
);

public record AdminRewardItemDto(
    int Id,
    string Name,
    string? Description,
    string Category,
    int CreditCost,
    string? Value,
    string? PreviewUrl,
    bool IsActive,
    int PurchaseCount,
    DateTime CreatedAt
);
