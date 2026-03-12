using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record ApproveStoryCommand(int Id, DateTime? PublishDate) : IRequest<Result<StoryDto>>;
