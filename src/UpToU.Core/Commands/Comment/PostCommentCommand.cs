using MediatR;
using UpToU.Core.DTOs.Comment;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Comment;

public record PostCommentCommand(
    int StoryId,
    string Body,
    int? ParentCommentId
) : IRequest<Result<CommentDto>>;
