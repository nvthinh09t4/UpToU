using MediatR;
using UpToU.Core.DTOs.Vote;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Comment;

public record VoteCommentCommand(int CommentId, string VoteType) : IRequest<Result<VoteResultDto>>;
