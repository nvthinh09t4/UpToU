using Hangfire;
using Hangfire.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UpToU.Core.DTOs.Jobs;
using UpToU.Infrastructure.Jobs;

namespace UpToU.API.Controllers;

[ApiController]
[Route("api/v1/jobs")]
[Authorize(Policy = "AdminOnly")]
public class JobsController : ControllerBase
{
    private readonly IBackgroundJobClient _jobClient;
    private readonly ILogger<JobsController> _logger;

    // Human-readable display names keyed by recurring job id
    private static readonly Dictionary<string, string> JobDisplayNames = new()
    {
        ["cleanup-notifications"]       = "Cleanup Archived Notifications",
        ["expired-ban-cleanup"]         = "Auto-Revoke Expired Bans",
        ["clear-expired-display-names"] = "Clear Expired Display Names",
        ["publish-approved-stories"]    = "Publish Scheduled Stories",
    };

    public JobsController(IBackgroundJobClient jobClient, ILogger<JobsController> logger)
    {
        _jobClient = jobClient;
        _logger = logger;
    }

    /// <summary>Returns all registered recurring jobs.</summary>
    [HttpGet("recurring")]
    public IActionResult GetRecurringJobs()
    {
        using var connection = JobStorage.Current.GetConnection();
        var jobs = connection.GetRecurringJobs();

        var dtos = jobs.Select(j => new RecurringJobInfoDto(
            j.Id,
            JobDisplayNames.GetValueOrDefault(j.Id, j.Id),
            j.Cron,
            j.LastExecution?.ToString("o"),
            j.NextExecution?.ToString("o"),
            j.LastJobState
        ));

        return Ok(dtos);
    }

    /// <summary>Returns queue statistics.</summary>
    [HttpGet("stats")]
    public IActionResult GetStats()
    {
        var api = JobStorage.Current.GetMonitoringApi();
        var stats = api.GetStatistics();

        return Ok(new JobStatsDto(
            stats.Enqueued,
            stats.Scheduled,
            stats.Processing,
            stats.Succeeded,
            stats.Failed,
            stats.Recurring
        ));
    }

    /// <summary>Returns recent job execution history (succeeded + failed).</summary>
    [HttpGet("history")]
    public IActionResult GetHistory([FromQuery] int count = 30)
    {
        var api = JobStorage.Current.GetMonitoringApi();

        var succeeded = api.SucceededJobs(0, count).Select(j => new JobHistoryItemDto(
            j.Key,
            j.Value.Job?.Method.Name ?? "Unknown",
            "Succeeded",
            j.Value.SucceededAt?.ToString("o"),
            j.Value.TotalDuration.HasValue ? $"{j.Value.TotalDuration.Value} ms" : null,
            null
        ));

        var failed = api.FailedJobs(0, count).Select(j => new JobHistoryItemDto(
            j.Key,
            j.Value.Job?.Method.Name ?? "Unknown",
            "Failed",
            j.Value.FailedAt?.ToString("o"),
            null,
            j.Value.ExceptionMessage
        ));

        var all = succeeded.Concat(failed)
            .OrderByDescending(j => j.ExecutedAt)
            .Take(count);

        return Ok(all);
    }

    /// <summary>Triggers a recurring job immediately as a one-off background job.</summary>
    [HttpPost("{jobId}/trigger")]
    public IActionResult TriggerJob([FromRoute] string jobId)
    {
        string newJobId;

        switch (jobId)
        {
            case "cleanup-notifications":
                newJobId = _jobClient.Enqueue<CleanupNotificationsJob>(j => j.ExecuteAsync(CancellationToken.None));
                break;

            case "expired-ban-cleanup":
                newJobId = _jobClient.Enqueue<ExpiredBanCleanupJob>(j => j.ExecuteAsync(CancellationToken.None));
                break;

            case "clear-expired-display-names":
                newJobId = _jobClient.Enqueue<ClearExpiredDisplayNamesJob>(j => j.ExecuteAsync(CancellationToken.None));
                break;

            case "publish-approved-stories":
                newJobId = _jobClient.Enqueue<PublishApprovedStoriesJob>(j => j.ExecuteAsync(CancellationToken.None));
                break;

            default:
                return NotFound(new { message = $"Unknown job: {jobId}" });
        }

        _logger.LogInformation("Admin manually triggered job. {JobId} -> {HangfireJobId}",
            jobId, newJobId);

        return Ok(new { jobId = newJobId, message = "Job enqueued successfully." });
    }
}
