interface PaymentSuccessUserTemplateData {
  customerName: string;
  formattedAmount: string;
  itemCount: number;
  type: string;
  downloadUrl: string;
  baseUrl?: string;
}

export function getPaymentSuccessUserTemplate(data: PaymentSuccessUserTemplateData): string {
  const { customerName, formattedAmount, itemCount, type, downloadUrl, baseUrl = "" } = data;
  
  const fullDownloadUrl = downloadUrl.startsWith('http') 
    ? downloadUrl 
    : `${baseUrl}${downloadUrl}`;
  
  const typeText = itemCount === 1 ? type.slice(0, -1) : type; 

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payment Confirmed – Your File is Ready to Download</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f6f8; padding: 20px;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: left;">
                    <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #111827; line-height: 1.3;">
                      Payment Confirmed – Your File is Ready to Download
                    </h1>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                      Hi ${customerName},
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                      Your payment of ${formattedAmount} for ${itemCount} ${typeText} is successful.
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                      Your file is ready to download:
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                      <a href="${fullDownloadUrl}" style="color: #EF8037; text-decoration: none; font-weight: 600; word-break: break-all;">Download Link: ${fullDownloadUrl}</a>
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                      The link will remain active for 7 days.
                    </p>
                    <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.6; color: #374151;">
                      Thank you for choosing AMFAccess!
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
