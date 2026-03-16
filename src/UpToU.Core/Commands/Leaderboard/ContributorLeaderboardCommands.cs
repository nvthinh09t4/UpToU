using MediatR;
using UpToU.Core.DTOs.Leaderboard;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Leaderboard;

/// <summary>
/// Returns the top authors ranked by contributed points —
/// the number of unique readers who have finished their stories.
/// </summary>
public record GetContributorLeaderboardQuery(int Top = 50)
    : IRequest<Result<ContributorLeaderboardDto>>;
