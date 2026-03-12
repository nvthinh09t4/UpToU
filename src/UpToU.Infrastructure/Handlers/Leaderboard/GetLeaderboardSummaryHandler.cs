using MediatR;
using UpToU.Core.Commands.Leaderboard;
using UpToU.Core.DTOs.Leaderboard;
using UpToU.Core.Models;

namespace UpToU.Infrastructure.Handlers.Leaderboard;

public class GetLeaderboardSummaryHandler
    : IRequestHandler<GetLeaderboardSummaryQuery, Result<LeaderboardSummaryDto>>
{
    private readonly IMediator _mediator;

    public GetLeaderboardSummaryHandler(IMediator mediator) => _mediator = mediator;

    public async Task<Result<LeaderboardSummaryDto>> Handle(
        GetLeaderboardSummaryQuery request, CancellationToken ct)
    {
        var overallTask = _mediator.Send(
            new GetOverallLeaderboardQuery(request.TimePeriod, request.Top), ct);
        var activeTask = _mediator.Send(
            new GetMostActiveLeaderboardQuery(request.TimePeriod, request.Top), ct);

        await Task.WhenAll(overallTask, activeTask);

        var overall = overallTask.Result;
        var active = activeTask.Result;

        if (!overall.IsSuccess)
            return Result<LeaderboardSummaryDto>.Failure(overall.Error, overall.StatusCode);
        if (!active.IsSuccess)
            return Result<LeaderboardSummaryDto>.Failure(active.Error, active.StatusCode);

        return Result<LeaderboardSummaryDto>.Success(new LeaderboardSummaryDto(
            Overall: overall.Value!,
            ByCategory: new List<LeaderboardDto>(),
            MostActive: active.Value!
        ));
    }
}
