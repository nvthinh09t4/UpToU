using MediatR;
using Microsoft.AspNetCore.Http;
using UpToU.Core.Commands.Story;
using UpToU.Core.DTOs.Story;
using UpToU.Core.Models;
using UpToU.Infrastructure.Data;
using UpToU.Infrastructure.Extensions;

namespace UpToU.Infrastructure.Handlers.Story;

public class GetStoryRatingHandler : IRequestHandler<GetStoryRatingQuery, Result<StoryRatingDto>>
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpContextAccessor _http;

    public GetStoryRatingHandler(ApplicationDbContext db, IHttpContextAccessor http)
    {
        _db   = db;
        _http = http;
    }

    public async Task<Result<StoryRatingDto>> Handle(GetStoryRatingQuery request, CancellationToken ct)
    {
        var userId = _http.GetUserId();
        var dto = await RateStoryHandler.BuildRatingDtoAsync(_db, request.StoryId, userId, ct);
        return Result<StoryRatingDto>.Success(dto);
    }
}
