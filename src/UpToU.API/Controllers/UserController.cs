using MediatR;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.Commands.User;
using UpToU.Core.DTOs.User;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/users")]
public class UserController : ControllerBase
{
    private readonly IMediator _mediator;

    public UserController(IMediator mediator) => _mediator = mediator;

    [HttpGet("search")]
    public async Task<ActionResult<List<UserMentionDto>>> Search([FromQuery] string q, CancellationToken ct)
    {
        var result = await _mediator.Send(new SearchUsersQuery(q ?? string.Empty), ct);
        return result.IsSuccess ? Ok(result.Value) : Problem(result.Error, statusCode: result.StatusCode);
    }
}
