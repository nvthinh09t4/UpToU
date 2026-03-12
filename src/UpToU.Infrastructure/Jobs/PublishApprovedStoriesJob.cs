using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Jobs;

public class PublishApprovedStoriesJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<PublishApprovedStoriesJob> _logger;

    public PublishApprovedStoriesJob(ApplicationDbContext db, ILogger<PublishApprovedStoriesJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("PublishApprovedStoriesJob started.");

        var published = await _db.Stories
            .IgnoreQueryFilters()
            .Where(s => s.Status == StoryStatus.Approved
                     && s.PublishDate != null
                     && s.PublishDate <= DateTime.UtcNow)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.Status,    StoryStatus.Published)
                .SetProperty(x => x.IsPublish, true),
            ct);

        _logger.LogInformation("PublishApprovedStoriesJob completed. {PublishedCount} stories published.", published);
    }
}
