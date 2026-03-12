namespace UpToU.Core.Entities;

/// <summary>Workflow status values for the Story entity.</summary>
public static class StoryStatus
{
    public const string Draft     = "Draft";
    public const string Submitted = "Submitted";  // awaiting supervisor review (locked for editing)
    public const string Approved  = "Approved";   // approved, pending scheduled publish date
    public const string Published = "Published";  // live
    public const string Rejected  = "Rejected";   // rejected — author can edit and re-submit
}
