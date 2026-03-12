using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.Admin;
using UpToU.Core.DTOs.Admin;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/admin/reports")]
[Authorize(Policy = "AdminOnly")]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReportsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<ReportDto>> GetReports(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetReportsQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }
}
