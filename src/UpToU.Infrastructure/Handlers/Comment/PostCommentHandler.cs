using System.Security.Claims;
using System.Text.RegularExpressions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Comment;
using UpToU.Core.DTOs.Comment;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;
using CommentEntity = UpToU.Core.Entities.Comment;
using NotificationEntity = UpToU.Core.Entities.Notification;

namespace UpToU.Infrastructure.Handlers.Comment;

public class PostCommentHandler : IRequestHandler<PostCommentCommand, Result<CommentDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PostCommentHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<CommentDto>> Handle(PostCommentCommand request, CancellationToken ct)
    {
        var httpUser = _httpContextAccessor.HttpContext?.User;
        var authorId = httpUser?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (authorId is null)
            return Result<CommentDto>.Unauthorized("Authentication required.");

        var firstName = httpUser!.FindFirstValue("firstName") ?? string.Empty;
        var lastName = httpUser.FindFirstValue("lastName") ?? string.Empty;
        var actorName = $"{firstName} {lastName}".Trim();

        // Validate parent comment exists and belongs to the same story
        if (request.ParentCommentId.HasValue)
        {
            var parent = await _db.Comments
                .FirstOrDefaultAsync(c => c.Id == request.ParentCommentId.Value && c.StoryId == request.StoryId, ct);
            if (parent is null)
                return Result<CommentDto>.NotFound("Parent comment not found.");
        }

        var comment = new CommentEntity
        {
            StoryId = request.StoryId,
            AuthorId = authorId,
            Body = request.Body,
            ParentCommentId = request.ParentCommentId,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync(ct);

        // Build notifications
        var notifications = new List<NotificationEntity>();

        // Notify parent comment's author when replying (skip if parent was deleted)
        if (request.ParentCommentId.HasValue)
        {
            var parentComment = await _db.Comments
                .IgnoreQueryFilters()
                .FirstAsync(c => c.Id == request.ParentCommentId.Value, ct);

            if (!parentComment.IsDeleted && parentComment.AuthorId != authorId)
            {
                notifications.Add(new NotificationEntity
                {
                    RecipientId = parentComment.AuthorId,
                    Type = "Reply",
                    StoryId = request.StoryId,
                    CommentId = comment.Id,
                    ActorName = actorName,
                    CreatedAt = DateTime.UtcNow,
                });
            }
        }

        // Notify @mentioned users
        var mentions = Regex.Matches(request.Body, @"@([\w.]+)");
        var mentionHandles = mentions.Select(m => m.Groups[1].Value.ToLower()).Distinct().ToList();
        if (mentionHandles.Count > 0)
        {
            var mentionedUsers = await _db.Users
                .Where(u => u.MentionHandle != null && mentionHandles.Contains(u.MentionHandle))
                .ToListAsync(ct);

            foreach (var mentioned in mentionedUsers)
            {
                if (mentioned.Id != authorId && notifications.All(n => n.RecipientId != mentioned.Id))
                {
                    notifications.Add(new NotificationEntity
                    {
                        RecipientId = mentioned.Id,
                        Type = "Mention",
                        StoryId = request.StoryId,
                        CommentId = comment.Id,
                        ActorName = actorName,
                        CreatedAt = DateTime.UtcNow,
                    });
                }
            }
        }

        if (notifications.Count > 0)
        {
            _db.Notifications.AddRange(notifications);
            await _db.SaveChangesAsync(ct);
        }

        var author = await _db.Users.FindAsync([authorId], ct);
        return Result<CommentDto>.Success(new CommentDto(
            comment.Id,
            comment.StoryId,
            new CommentAuthorDto(authorId, actorName, author?.MentionHandle),
            comment.Body,
            comment.ParentCommentId,
            comment.CreatedAt,
            comment.EditedAt,
            [],
            0, 0, null
        ));
    }
}
