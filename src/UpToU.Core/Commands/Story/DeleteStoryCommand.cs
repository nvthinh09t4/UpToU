using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record DeleteStoryCommand(int Id) : IRequest<Result<bool>>;
