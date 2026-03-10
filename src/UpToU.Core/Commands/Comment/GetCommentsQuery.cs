using MediatR;
using UpToU.Core.DTOs.Comment;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Comment;

// SortBy: "Newest" | "Oldest" | "MostUpvoted" | "MostDownvoted"
public record GetCommentsQuery(int StoryId, string SortBy = "Newest") : IRequest<Result<List<CommentDto>>>;
