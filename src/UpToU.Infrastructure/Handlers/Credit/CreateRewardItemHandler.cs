using MediatR;
using UpToU.Core.Commands.Credit;
using UpToU.Core.DTOs.Credit;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Credit;

public class CreateRewardItemHandler : IRequestHandler<CreateRewardItemCommand, Result<AdminRewardItemDto>>
{
    private readonly ApplicationDbContext _db;
    public CreateRewardItemHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<AdminRewardItemDto>> Handle(CreateRewardItemCommand request, CancellationToken ct)
    {
        var validCategories = new[] { "Title", "AvatarFrame", "Avatar", "StoryAccess" };
        if (!validCategories.Contains(request.Category))
            return Result<AdminRewardItemDto>.Failure("Invalid category.");

        var item = new RewardItem
        {
            Name        = request.Name,
            Description = request.Description,
            Category    = request.Category,
            CreditCost  = request.CreditCost,
            Value       = request.Value,
            PreviewUrl  = request.PreviewUrl,
            IsActive    = true,
        };

        _db.RewardItems.Add(item);
        await _db.SaveChangesAsync(ct);

        return Result<AdminRewardItemDto>.Success(new AdminRewardItemDto(
            item.Id, item.Name, item.Description, item.Category, item.CreditCost,
            item.Value, item.PreviewUrl, item.IsActive, 0, item.CreatedAt));
    }
}
