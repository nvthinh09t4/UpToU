namespace UpToU.Infrastructure.Options;

public class DatabaseOptions
{
    public const string SectionName = "ConnectionStrings";

    public string ConnectionString { get; set; } = string.Empty;
}
