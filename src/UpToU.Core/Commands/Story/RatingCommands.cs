using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

public record RateStoryCommand(int StoryId, int Rating, string? Comment) : IRequest<Result<StoryRatingDto>>;
public record GetStoryRatingQuery(int StoryId) : IRequest<Result<StoryRatingDto>>;
public record GetRecommendedStoriesQuery(int Count = 6) : IRequest<Result<List<RecommendedStoryDto>>>;
