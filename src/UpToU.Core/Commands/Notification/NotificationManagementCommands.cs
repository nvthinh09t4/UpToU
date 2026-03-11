using MediatR;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.DTOs.Notification;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Notification;

/// <summary>
/// Get notifications by folder: Inbox (unread+read, not archived), Archive, Important.
/// </summary>
public record GetNotificationsByFolderQuery(
    string Folder = "Inbox",
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<NotificationDto>>>;

/// <summary>Move read notifications to archive.</summary>
public record ArchiveNotificationsCommand(List<int> NotificationIds) : IRequest<Result<bool>>;

/// <summary>Toggle important flag on a notification.</summary>
public record ToggleImportantCommand(int NotificationId) : IRequest<Result<bool>>;

/// <summary>Delete archived notifications (non-important only). Called by user or cleanup job.</summary>
public record DeleteArchivedNotificationsCommand() : IRequest<Result<int>>;
