namespace UpToU.Core.DTOs.Admin;

public record PagedResult<T>(
    IList<T> Items,
    int TotalCount,
    int Page,
    int PageSize
)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}
