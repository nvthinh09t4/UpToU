using MediatR;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Category;

public record DeleteCategoryCommand(int Id) : IRequest<Result<bool>>;
