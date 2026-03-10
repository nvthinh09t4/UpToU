using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record DeleteTagCommand(int Id) : IRequest<Result<bool>>;
