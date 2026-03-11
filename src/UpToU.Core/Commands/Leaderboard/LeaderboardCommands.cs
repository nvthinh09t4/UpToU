using MediatR;
using UpToU.Core.DTOs.Leaderboard;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Leaderboard;

/// <summary>
/// Get the overall leaderboard ranked by total credits earned.
/// TimePeriod: "AllTime" | "Monthly" | "Weekly"
/// </summary>
public record GetOverallLeaderboardQuery(
    string TimePeriod = "AllTime",
    int Top = 50
) : IRequest<Result<LeaderboardDto>>;

/// <summary>
/// Get leaderboard for a specific category.
/// </summary>
public record GetCategoryLeaderboardQuery(
    int CategoryId,
    string TimePeriod = "AllTime",
    int Top = 50
) : IRequest<Result<LeaderboardDto>>;

/// <summary>
/// Get leaderboard ranked by most activities (transaction count).
/// </summary>
public record GetMostActiveLeaderboardQuery(
    string TimePeriod = "AllTime",
    int Top = 50
) : IRequest<Result<LeaderboardDto>>;

/// <summary>
/// Get the combined summary: overall + per-category + most active.
/// </summary>
public record GetLeaderboardSummaryQuery(
    string TimePeriod = "AllTime",
    int Top = 10
) : IRequest<Result<LeaderboardSummaryDto>>;
