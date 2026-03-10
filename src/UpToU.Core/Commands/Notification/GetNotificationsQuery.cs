using MediatR;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.DTOs.Notification;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Notification;

public record GetNotificationsQuery(int Page = 1, int PageSize = 20) : IRequest<Result<PagedResult<NotificationDto>>>;
