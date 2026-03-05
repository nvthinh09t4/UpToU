using MediatR;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Admin;

public record GetDashboardStatsQuery : IRequest<Result<DashboardStatsDto>>;
