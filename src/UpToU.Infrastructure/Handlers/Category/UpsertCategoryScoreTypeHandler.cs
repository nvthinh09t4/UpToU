using System.Text.RegularExpressions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using UpToU.Core.Commands.Category;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Entities;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Handlers.Category;

public class UpsertCategoryScoreTypeHandler : IRequestHandler<UpsertCategoryScoreTypeCommand, Result<CategoryScoreTypeDto>>
{
    private static readonly Regex ValidName = new(@"^[a-z][a-z0-9_]*$", RegexOptions.Compiled);

    private readonly ApplicationDbContext _db;
    public UpsertCategoryScoreTypeHandler(ApplicationDbContext db) => _db = db;

    public async Task<Result<CategoryScoreTypeDto>> Handle(UpsertCategoryScoreTypeCommand request, CancellationToken ct)
    {
        if (!ValidName.IsMatch(request.Name))
            return Result<CategoryScoreTypeDto>.Failure(
                "Name must start with a lowercase letter and contain only lowercase letters, digits, and underscores.");

        if (request.ScoreWeight < 0 || request.ScoreWeight > 100)
            return Result<CategoryScoreTypeDto>.Failure("ScoreWeight must be between 0 and 100.");

        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct);
        if (!categoryExists)
            return Result<CategoryScoreTypeDto>.NotFound("Category not found.");

        // Enforce (CategoryId, Name) uniqueness
        var duplicate = await _db.CategoryScoreTypes.AnyAsync(
            st => st.CategoryId == request.CategoryId
               && st.Name == request.Name
               && st.Id != (request.Id ?? 0), ct);
        if (duplicate)
            return Result<CategoryScoreTypeDto>.Failure($"A score type named '{request.Name}' already exists in this category.");

        CategoryScoreType scoreType;
        if (request.Id.HasValue)
        {
            scoreType = await _db.CategoryScoreTypes.FirstOrDefaultAsync(st => st.Id == request.Id.Value, ct)
                ?? throw new KeyNotFoundException($"ScoreType {request.Id} not found.");
        }
        else
        {
            scoreType = new CategoryScoreType { CategoryId = request.CategoryId };
            _db.CategoryScoreTypes.Add(scoreType);
        }

        scoreType.Name        = request.Name;
        scoreType.Label       = request.Label;
        scoreType.ScoreWeight = request.ScoreWeight;
        scoreType.OrderToShow = request.OrderToShow;

        await _db.SaveChangesAsync(ct);

        return Result<CategoryScoreTypeDto>.Success(
            new CategoryScoreTypeDto(scoreType.Id, scoreType.Name, scoreType.Label, scoreType.ScoreWeight, scoreType.OrderToShow));
    }
}
