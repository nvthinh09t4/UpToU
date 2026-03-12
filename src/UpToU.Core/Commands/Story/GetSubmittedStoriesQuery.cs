using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record GetSubmittedStoriesQuery : IRequest<Result<List<StoryDto>>>;
