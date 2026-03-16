using MediatR;
using UpToU.Core.DTOs.Category;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Category;

public record GetCategoryBadgesQuery(int CategoryId)
    : IRequest<Result<List<CategoryBadgeDto>>>;

public record UpsertCategoryBadgeCommand(
    int? Id,
    int CategoryId,
    int Tier,
    string Label,
    string? LabelVi,
    int ScoreThreshold,
    string? BadgeImageUrl
) : IRequest<Result<CategoryBadgeDto>>;

public record DeleteCategoryBadgeCommand(int Id)
    : IRequest<Result<bool>>;

public record GetUserBadgesQuery(string UserId)
    : IRequest<Result<List<UserCategoryBadgeDto>>>;
