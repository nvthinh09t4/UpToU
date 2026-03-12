using MediatR;
using UpToU.Core.DTOs.Admin;
using UpToU.Core.Models;

namespace UpToU.Core.Commands.Admin;

public record GetReportsQuery : IRequest<Result<ReportDto>>;
