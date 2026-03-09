using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record AddStoryDetailCommand(
    int StoryId,
    string SavePath,
    string? Content,
    int WordCount,
    string? ChangeNotes,
    decimal ScoreWeight,
    bool IsPublish = true
) : IRequest<Result<StoryDetailDto>>;
