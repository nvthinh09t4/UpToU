namespace UpToU.Core.Entities;

/// <summary>Known Type discriminator values for CreditTransaction records.</summary>
public static class CreditTransactionTypes
{
    public const string StoryComplete = "StoryComplete";
    public const string StoryRead     = "StoryRead";
    public const string StreakBonus   = "StreakBonus";
}
