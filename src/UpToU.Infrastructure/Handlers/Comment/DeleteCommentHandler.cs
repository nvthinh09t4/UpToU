using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Comment;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Comment;

public class DeleteCommentHandler : IRequestHandler<DeleteCommentCommand, Result<bool>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DeleteCommentHandler(ApplicationDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<bool>> Handle(DeleteCommentCommand request, CancellationToken ct)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var userId = user?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
            return Result<bool>.Unauthorized("Authentication required.");

        var comment = await _db.Comments
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == request.CommentId, ct);

        if (comment is null)
            return Result<bool>.NotFound("Comment not found.");

        var isAdmin = user!.IsInRole("Admin");
        if (comment.AuthorId != userId && !isAdmin)
            return Result<bool>.Failure("You can only delete your own comments.", 403);

        comment.IsDeleted = true;
        await _db.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }
}
