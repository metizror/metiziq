interface PaymentSuccessAdminTemplateData {
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  formattedAmount: string;
  itemCount: number;
  type: string;
  transactionId: string | null;
  formattedDate: string;
}

export function getPaymentSuccessAdminTemplate(data: PaymentSuccessAdminTemplateData): string {
  const { customerName, customerEmail, invoiceNumber, formattedAmount, itemCount, type, transactionId, formattedDate } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payment Received</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f6f8; padding: 20px;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" style="width: 100%; max-width: 620px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding: 32px 36px 12px 36px; text-align: left;">
                    <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #111827;">Payment Received</h2>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">New successful payment on AMFAccess platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 36px 32px 36px; text-align: left;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #374151; width: 180px; font-weight: 600;">Customer Name</td>
                        <td style="padding: 10px 0; font-size: 15px; color: #111827;">${customerName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #374151; width: 180px; font-weight: 600;">Customer Email</td>
                        <td style="padding: 10px 0; font-size: 15px; color: #111827;">${customerEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #374151; width: 180px; font-weight: 600;">Invoice Number</td>
                        <td style="padding: 10px 0; font-size: 15px; color: #111827;">${invoiceNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #374151; width: 180px; font-weight: 600;">Amount</td>
                        <td style="padding: 10px 0; font-size: 15px; color: #111827; font-weight: 600;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #374151; width: 180px; font-weight: 600;">Items</td>
                        <td style="padding: 10px 0; font-size: 15px; color: #111827;">${itemCount} ${type}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #374151; width: 180px; font-weight: 600;">Payment Method</td>
                        <td style="padding: 10px 0; font-size: 15px; color: #111827;">PayPal</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #374151; width: 180px; font-weight: 600;">Transaction ID</td>
                        <td style="padding: 10px 0; font-size: 15px; color: #111827;">${transactionId || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 15px; color: #374151; width: 180px; font-weight: 600;">Date</td>
                        <td style="padding: 10px 0; font-size: 15px; color: #111827;">${formattedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 36px 32px 36px; text-align: left; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                      Regards,<br />
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
