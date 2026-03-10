using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Notification;

public record MarkNotificationsReadCommand(List<int> NotificationIds) : IRequest<Result<bool>>;
