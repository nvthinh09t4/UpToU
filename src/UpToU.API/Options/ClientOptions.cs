namespace UpToU.API.Options;

public class ClientOptions
{
    public const string SectionName = "Client";
    public string BaseUrl { get; init; } = "http://localhost:5173";
    public string CrmBaseUrl { get; init; } = "http://localhost:5174";
}
