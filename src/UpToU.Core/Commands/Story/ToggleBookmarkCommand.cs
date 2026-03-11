using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record ToggleBookmarkCommand(int StoryId) : IRequest<Result<bool>>;
// Returns true = now bookmarked, false = now removed
