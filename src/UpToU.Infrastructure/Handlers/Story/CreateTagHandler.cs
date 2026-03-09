using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Story;

public class CreateTagHandler : IRequestHandler<CreateTagCommand, Result<TagDto>>
{
    private readonly ApplicationDbContext _db;

    public CreateTagHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<TagDto>> Handle(CreateTagCommand request, CancellationToken ct)
    {
        var exists = await _db.Tags.AnyAsync(t => t.Name == request.Name, ct);
        if (exists)
            return Result<TagDto>.Conflict($"Tag '{request.Name}' already exists.");

        var tag = new Tag { Name = request.Name };
        _db.Tags.Add(tag);
        await _db.SaveChangesAsync(ct);

        return Result<TagDto>.Success(new TagDto(tag.Id, tag.Name));
    }
}
