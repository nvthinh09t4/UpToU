using MediatR;
using UpToU.Core.DTOs.User;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.User;

public record SearchUsersQuery(string Prefix) : IRequest<Result<List<UserMentionDto>>>;
