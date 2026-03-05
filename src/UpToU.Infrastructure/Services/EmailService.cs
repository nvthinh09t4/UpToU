using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using UpToU.Core.Interfaces;
using UpToU.Infrastructure.Options;

namespace UpToU.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly SmtpOptions _smtpOptions;

    public EmailService(IOptions<SmtpOptions> smtpOptions)
    {
        _smtpOptions = smtpOptions.Value;
    }

    public async Task SendEmailConfirmationAsync(string email, string confirmationLink, CancellationToken ct)
    {
        var subject = "Confirm your UpToU account";
        var body = $"""
            <h2>Welcome to UpToU!</h2>
            <p>Please confirm your email address by clicking the link below:</p>
            <p><a href="{confirmationLink}">Confirm Email</a></p>
            <p>If you did not create an account, you can safely ignore this email.</p>
            """;

        await SendAsync(email, subject, body, ct);
    }

    public async Task SendPasswordResetAsync(string email, string resetLink, CancellationToken ct)
    {
        var subject = "Reset your UpToU password";
        var body = $"""
            <h2>Password Reset</h2>
            <p>Click the link below to reset your password:</p>
            <p><a href="{resetLink}">Reset Password</a></p>
            <p>This link expires in 1 hour. If you did not request a reset, ignore this email.</p>
            """;

        await SendAsync(email, subject, body, ct);
    }

    private async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct)
    {
        using var client = new SmtpClient(_smtpOptions.Host, _smtpOptions.Port)
        {
            Credentials = new NetworkCredential(_smtpOptions.Username, _smtpOptions.Password),
            EnableSsl = true
        };

        using var message = new MailMessage
        {
            From = new MailAddress(_smtpOptions.FromAddress, _smtpOptions.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        message.To.Add(to);

        await client.SendMailAsync(message, ct);
    }
}
