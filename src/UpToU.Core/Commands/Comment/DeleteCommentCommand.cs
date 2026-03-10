using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Comment;

public record DeleteCommentCommand(int CommentId) : IRequest<Result<bool>>;
