namespace UpToU.Core.DTOs.Story;

public record StoryDetailDto(
    int Id,
    int StoryId,
    int Revision,
    bool IsPublish,
    string? Content,
    int WordCount,
    string? ChangeNotes,
    decimal ScoreWeight,
    List<decimal> ScoreWeightHistory,
    string SavePath,
    DateTime CreatedOn,
    string? CreatedBy
);
