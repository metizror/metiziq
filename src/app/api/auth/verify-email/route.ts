import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import customerAuthModel from "@/models/customer_auth.model";
import { sendMail } from "@/services/email.service";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }

    const customer = await customerAuthModel.findOne({
      emailVerificationToken: token,
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    if (
      !customer.emailVerificationExpiry ||
      customer.emailVerificationExpiry < new Date()
    ) {
      return NextResponse.json(
        { message: "Verification token has expired" },
        { status: 400 }
      );
    }

    if (customer.isEmailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 200 }
      );
    }

    await customerAuthModel.updateOne(
      { _id: customer._id },
      {
        $set: { isEmailVerified: true },
        $unset: { emailVerificationToken: "", emailVerificationExpiry: "" },
      }
    );

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || "";
    const normalizedBaseUrl = appUrl.replace(/\/$/, "");
    const loginUrl = `${normalizedBaseUrl || "http://localhost:3000"}`;

    const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Email Verified</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            .container { text-align: center; background: #fff; padding: 32px 40px; border-radius: 12px; box-shadow: 0 4px 25px rgba(0,0,0,0.08); max-width: 420px; }
            h1 { color: #111827; margin-bottom: 12px; }
            p { color: #4b5563; line-height: 1.5; }
            .redirect { margin-top: 20px; color: #9ca3af; font-size: 14px; }
          </style>
          <script>
            setTimeout(function () {
              window.location.href = "${loginUrl}";
            }, 2000);
          </script>
        </head>
        <body>
          <div class="container">
            <h1>Email verified successfully</h1>
            <p>Your account is now active. We are redirecting you to the login page.</p>
            <p class="redirect">If you are not redirected automatically, <a href="${loginUrl}">click here</a>.</p>
          </div>
        </body>
      </html>
    `;

    const welcomeEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Welcome to AMFAccess</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f6f8;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f6f8; padding: 20px;">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 30px 40px; text-align: left;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827; line-height: 1.3;">
                        Hi ${customer.firstName},
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 30px 40px; text-align: left;">
                      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                        Welcome to <strong st yle="color: #111827;">AMFAccess</strong>, your on-demand B2B contact & company database.
                      </p>
                      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                        Your account is now active, and you can start exploring millions of verified business contacts.
                      </p>
                      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
                        If you need any help, reply to this email anytime.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px 40px 40px; text-align: left; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
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

    await sendMail({
      to: customer.email,
      subject: "Welcome to AMFAccess!",
      html: welcomeEmailHtml,
    });

    const adminNotificationHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>New User Registered</title>
        </head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f6f8;">
          <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f4f6f8;padding:20px;">
            <tr>
              <td align="center" style="padding:20px 0;">
                <table role="presentation" style="width:100%;max-width:620px;background-color:#ffffff;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="padding:32px 36px 12px 36px;text-align:left;">
                      <h2 style="margin:0;font-size:22px;font-weight:600;color:#111827;">New user registered</h2>
                      <p style="margin:8px 0 0 0;font-size:14px;color:#6b7280;">AMFAccess platform signup</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 36px 32px 36px;text-align:left;">
                      <table role="presentation" style="width:100%;border-collapse:collapse;">
                        <tr>
                          <td style="padding:10px 0;font-size:15px;color:#374151;width:160px;font-weight:600;">Name</td>
                          <td style="padding:10px 0;font-size:15px;color:#111827;">${
                            customer.firstName
                          } ${customer.lastName}</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;font-size:15px;color:#374151;width:160px;font-weight:600;">Email</td>
                          <td style="padding:10px 0;font-size:15px;color:#111827;">${
                            customer.email
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;font-size:15px;color:#374151;width:160px;font-weight:600;">Company</td>
                          <td style="padding:10px 0;font-size:15px;color:#111827;">${
                            customer.companyName || "—"
                          }</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0;font-size:15px;color:#374151;width:160px;font-weight:600;">Signup Time</td>
                          <td style="padding:10px 0;font-size:15px;color:#111827;">${new Date().toISOString()}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 36px 32px 36px;text-align:left;border-top:1px solid #e5e7eb;">
                      <p style="margin:20px 0 0 0;font-size:14px;line-height:1.6;color:#6b7280;">
                        Regards,<br />
                        <strong style="color:#111827;">Team AMFAccess</strong>
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

    await sendMail({
      to: "umesh.dangar@metizsoft.com",
      subject: "New User Registered – AMFAccess",
      html: adminNotificationHtml,
    });

    return new NextResponse(successHtml, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (error: any) {
    console.error("Verify email route error:", error);
    return NextResponse.json(
      { message: "Failed to verify email", error: error.message },
      { status: 500 }
    );
  }
}
