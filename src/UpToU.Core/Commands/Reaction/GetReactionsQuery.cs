using MediatR;
using UpToU.Core.DTOs.Reaction;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Reaction;

public record GetReactionsQuery(int StoryId, string? CurrentUserId) : IRequest<Result<ReactionSummaryDto>>;
