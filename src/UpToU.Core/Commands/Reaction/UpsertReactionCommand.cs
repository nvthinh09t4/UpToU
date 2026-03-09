using MediatR;
using UpToU.Core.DTOs.Reaction;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Reaction;

public record UpsertReactionCommand(int StoryId, string ReactionType) : IRequest<Result<ReactionSummaryDto>>;
