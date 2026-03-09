using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record GetAdminStoriesQuery(int? CategoryId = null) : IRequest<Result<List<StoryDto>>>;
