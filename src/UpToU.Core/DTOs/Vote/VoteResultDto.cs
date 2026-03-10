namespace UpToU.Core.DTOs.Vote;

public record VoteResultDto(int UpvoteCount, int DownvoteCount, string? CurrentUserVote);
