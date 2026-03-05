using MediatR;
using UpToU.Core.DTOs.Category;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Category;

public record CreateCategoryCommand(
    string Title,
    string? Description,
    bool IsActive,
    decimal ScoreWeight,
    int OrderToShow,
    int? ParentId
) : IRequest<Result<CategoryDto>>;
