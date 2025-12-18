interface DailyLimitReachedTemplateData {
  customerName: string;
}

export function getDailyLimitReachedTemplate(
  data: DailyLimitReachedTemplateData
): string {
  const { customerName } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Daily Download Limit Reached</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f6f8; padding: 20px;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: left;">
                    <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #111827; line-height: 1.3;">
                      Daily Download Limit Reached
                    </h1>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                      Hi ${customerName},
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                      You've reached your daily download limit of 10,000 records.
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                      You may continue downloading again the following day.
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
