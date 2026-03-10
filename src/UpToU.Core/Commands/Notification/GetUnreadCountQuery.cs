using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Notification;

public record GetUnreadCountQuery() : IRequest<Result<int>>;
