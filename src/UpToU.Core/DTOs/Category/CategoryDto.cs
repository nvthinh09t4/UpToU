namespace UpToU.Core.DTOs.Category;

public record CategoryDto(
    int Id,
    string Title,
    string? Description,
    bool IsActive,
    decimal ScoreWeight,
    List<decimal> ScoreWeightHistory,
    int OrderToShow,
    int? ParentId,
    DateTime CreatedOn,
    DateTime? ModifiedOn,
    string? CreatedBy,
    string? ModifiedBy,
    List<CategoryDto> Children
);

public record CategoryBadgeDto(
    int Id,
    int Tier,
    string Label,
    string? LabelVi,
    int ScoreThreshold,
    string? BadgeImageUrl
);

public record UserCategoryBadgeDto(
    int BadgeId,
    int CategoryId,
    string CategoryTitle,
    int Tier,
    string Label,
    string? LabelVi,
    string? BadgeImageUrl,
    DateTime AwardedAt
);
