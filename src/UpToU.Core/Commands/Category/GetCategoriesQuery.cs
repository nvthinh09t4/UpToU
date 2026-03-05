using MediatR;
using UpToU.Core.DTOs.Category;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Category;

public record GetCategoriesQuery(bool ActiveOnly = true) : IRequest<Result<List<CategoryDto>>>;
