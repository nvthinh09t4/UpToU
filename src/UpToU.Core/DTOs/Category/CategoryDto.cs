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
