namespace UpToU.Core.DTOs.Admin;

public record DashboardStatsDto(
    int TotalUsers,
    int RegisteredToday,
    int LoggedInToday,
    int TotalRoles,
    int ActiveUsers
);
