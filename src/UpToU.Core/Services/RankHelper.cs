namespace UpToU.Core.Services;

public static class RankHelper
{
    public record RankInfo(string Name, int Stars, string Color);

    // (Name, Min credit threshold, Credits per star)
    private static readonly (string Name, int Min, int PerStar)[] Tiers =
    [
        ("Herald",   0,     100),
        ("Guardian", 500,   150),
        ("Crusader", 1250,  250),
        ("Archon",   2500,  400),
        ("Legend",   4500,  600),
        ("Ancient",  7500,  1000),
        ("Divine",   12500, 1500),
        ("Immortal", 20000, 5000),
    ];

    public static readonly IReadOnlyList<(string Name, int Min, int PerStar)> AllTiers = Tiers;

    public static readonly Dictionary<string, string> Colors = new()
    {
        ["Herald"]   = "#9e9e9e",
        ["Guardian"] = "#4caf50",
        ["Crusader"] = "#29b6f6",
        ["Archon"]   = "#26c6da",
        ["Legend"]   = "#5c6bc0",
        ["Ancient"]  = "#7e57c2",
        ["Divine"]   = "#ffd700",
        ["Immortal"] = "#ff5722",
    };

    public static RankInfo GetRank(int allTimeCredits)
    {
        var idx = Tiers.Length - 1;
        for (var i = 0; i < Tiers.Length; i++)
        {
            if (allTimeCredits < Tiers[i].Min) { idx = i - 1; break; }
        }
        if (idx < 0) idx = 0;
        var (name, min, perStar) = Tiers[idx];
        var stars = (int)Math.Min(5, 1 + (allTimeCredits - min) / perStar);
        return new RankInfo(name, stars, Colors[name]);
    }

    /// <summary>Returns (nextThreshold, nextLabel) for rank progress display.</summary>
    public static (int NextAt, string NextLabel) GetNextThreshold(int allTimeCredits)
    {
        var idx = Tiers.Length - 1;
        for (var i = 0; i < Tiers.Length; i++)
        {
            if (allTimeCredits < Tiers[i].Min) { idx = i - 1; break; }
        }
        if (idx < 0) idx = 0;
        var (name, min, perStar) = Tiers[idx];
        var stars = (int)Math.Min(5, 1 + (allTimeCredits - min) / perStar);

        if (stars < 5)
        {
            var nextAt = min + stars * perStar;
            return (nextAt, $"{name} ★{stars + 1}");
        }
        if (idx + 1 < Tiers.Length)
            return (Tiers[idx + 1].Min, Tiers[idx + 1].Name + " ★1");

        return (allTimeCredits, "Max Rank");
    }
}
