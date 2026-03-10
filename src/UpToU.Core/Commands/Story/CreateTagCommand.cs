using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record CreateTagCommand(string Name) : IRequest<Result<TagDto>>;
