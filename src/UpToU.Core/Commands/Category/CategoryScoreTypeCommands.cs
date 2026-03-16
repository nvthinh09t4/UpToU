using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Category;

public record GetCategoryScoreTypesQuery(int CategoryId)
    : IRequest<Result<List<CategoryScoreTypeDto>>>;

public record UpsertCategoryScoreTypeCommand(
    int? Id,
    int CategoryId,
    string Name,
    string? Label,
    decimal ScoreWeight,
    int OrderToShow
) : IRequest<Result<CategoryScoreTypeDto>>;

public record DeleteCategoryScoreTypeCommand(int Id)
    : IRequest<Result<bool>>;
