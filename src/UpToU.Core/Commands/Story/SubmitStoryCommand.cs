using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record SubmitStoryCommand(int Id) : IRequest<Result<StoryDto>>;
