using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace UpToU.Infrastructure.Extensions;

internal static class HttpContextExtensions
{
    /// <summary>Returns the authenticated user's ID, or null when the request is anonymous.</summary>
    internal static string? GetUserId(this IHttpContextAccessor accessor)
        => accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
}
