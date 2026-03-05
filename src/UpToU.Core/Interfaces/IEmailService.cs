namespace UpToU.Core.Interfaces;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(string email, string confirmationLink, CancellationToken ct);
    Task SendPasswordResetAsync(string email, string resetLink, CancellationToken ct);
}
