using MediatR;
using UpToU.Core.DTOs.Vote;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record VoteStoryCommand(int StoryId, string VoteType) : IRequest<Result<VoteResultDto>>;
