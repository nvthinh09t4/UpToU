using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace UpToU.API.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Path}", context.Request.Path);
            await WriteProblemDetailsAsync(context);
        }
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context)
    {
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = 500,
            Title = "An unexpected error occurred.",
            Type = "https://tools.ietf.org/html/rfc7807"
        };

        var json = JsonSerializer.Serialize(problem,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        await context.Response.WriteAsync(json);
    }
}
