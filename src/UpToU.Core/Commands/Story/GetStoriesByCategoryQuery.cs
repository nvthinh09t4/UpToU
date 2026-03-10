using MediatR;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Story;

// SortBy: "Newest" | "Oldest" | "MostUpvoted" | "MostDownvoted" | "MostViewed"
public record GetStoriesByCategoryQuery(int CategoryId, string SortBy = "Newest") : IRequest<Result<List<StoryDto>>>;
