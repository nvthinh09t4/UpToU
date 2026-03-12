namespace UpToU.Core.DTOs.Jobs;

public record RecurringJobInfoDto(
    string Id,
    string DisplayName,
    string Cron,
    string? LastExecution,
    string? NextExecution,
    string? LastJobState
);

public record JobHistoryItemDto(
    string Id,
    string JobName,
    string State,
    string? ExecutedAt,
    string? Duration,
    string? ExceptionMessage
);

public record JobStatsDto(
    long Enqueued,
    long Scheduled,
    long Processing,
    long Succeeded,
    long Failed,
    long Recurring
);
