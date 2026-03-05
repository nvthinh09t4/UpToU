using MediatR;
using UpToU.Core.DTOs.Category;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Category;

public record GetCategoryByIdQuery(int Id) : IRequest<Result<CategoryDto>>;
