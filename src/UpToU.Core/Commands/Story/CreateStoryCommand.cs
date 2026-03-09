using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record CreateStoryCommand(
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
    // First revision fields
    string SavePath,
    string? Content,
    int WordCount,
    decimal ScoreWeight
) : IRequest<Result<StoryDto>>;
