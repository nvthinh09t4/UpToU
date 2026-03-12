using MediatR;
using UpToU.Core.DTOs.Progress;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Progress;

public record GetUserProgressQuery(string UserId) : IRequest<Result<UserProgressDto>>;
