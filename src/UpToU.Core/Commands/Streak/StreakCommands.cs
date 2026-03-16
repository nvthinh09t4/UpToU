using MediatR;
using UpToU.Core.DTOs.Streak;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Streak;

public record GetUserStreakQuery() : IRequest<Result<StreakDto>>;
