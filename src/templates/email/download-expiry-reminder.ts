interface DownloadExpiryReminderTemplateData {
  customerName: string;
  fileName: string;
  downloadUrl: string;
  baseUrl?: string;
}

export function getDownloadExpiryReminderTemplate(
  data: DownloadExpiryReminderTemplateData
): string {
  const { customerName, fileName, downloadUrl, baseUrl = "" } = data;

  const fullDownloadUrl = downloadUrl.startsWith("http")
    ? downloadUrl
    : `${baseUrl}${downloadUrl}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your Download Link Will Expire Soon</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f6f8; padding: 20px;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: left;">
                    <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #111827; line-height: 1.3;">
                      Your Download Link Will Expire Soon
                    </h1>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                      Hi ${customerName},
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                      A reminder that your download link for <strong>${fileName}</strong> will expire in 48 hours.
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                      If you haven't downloaded it yet, please do so soon:
                    </p>
                    <div style="margin: 30px 0; text-align: center;">
                      <a href="${fullDownloadUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #2563EB, #EB432F); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(239, 128, 55, 0.3);">
                        Download Now
                      </a>
                    </div>
                    <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                      <strong>Note:</strong> This link will expire in 48 hours. Please download your file before it expires.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px 40px 40px; text-align: left; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                      <strong style="color: #111827;">Team AMFAccess</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
