using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record UpdateStoryCommand(
    int Id,
    string Title,
    string? Slug,
    string? Description,
    string? Excerpt,
    string? CoverImageUrl,
    string? AuthorName,
    bool IsFeatured,
    int CategoryId,
    DateTime? PublishDate,
    bool IsPublish,
    List<int> TagIds,
    string? AssignedSupervisorId = null
) : IRequest<Result<StoryDto>>;
