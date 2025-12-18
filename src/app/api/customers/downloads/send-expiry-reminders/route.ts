import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import Invoice from "../../../../../models/invoice.model";
import { sendMail } from "../../../../../services/email.service";
import { getDownloadExpiryReminderTemplate } from "../../../../../templates/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = request.headers.get("x-vercel-cron");
    
    if (cronSecret && !isVercelCron) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const startOfTwoDaysWindow = new Date(twoDaysFromNow.getTime() - 12 * 60 * 60 * 1000); 
    const endOfTwoDaysWindow = new Date(twoDaysFromNow.getTime() + 12 * 60 * 60 * 1000); 

    const invoicesToRemind = await Invoice.find({
      paymentStatus: "completed",
      expiresAt: {
        $gte: startOfTwoDaysWindow,
        $lte: endOfTwoDaysWindow,
      },
      expiryReminderSent: { $ne: true },
      downloadUrl: { $exists: true, $ne: null },
      fileName: { $exists: true, $ne: null },
    })
      .select("customerName customerEmail fileName downloadUrl expiresAt")
      .exec();

    if (invoicesToRemind.length === 0) {
      return NextResponse.json({
        message: "No invoices need expiry reminders at this time",
        remindersSent: 0,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://a-market-force-frontend.vercel.app";
    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    // Send reminder emails
    for (const invoice of invoicesToRemind) {
      try {
        const reminderEmailHtml = getDownloadExpiryReminderTemplate({
          customerName: invoice.customerName.split(" ")[0] || invoice.customerName,
          fileName: invoice.fileName || "your file",
          downloadUrl: baseUrl
        });

        await sendMail({
          to: invoice.customerEmail,
          subject: "Your Download Link Will Expire Soon",
          html: reminderEmailHtml,
        });

        await Invoice.updateOne(
          { _id: invoice._id },
          { $set: { expiryReminderSent: true } }
        );

        results.success.push(invoice._id.toString());
      } catch (error: any) {
        console.error(
          `Error sending expiry reminder for invoice ${invoice._id}:`,
          error
        );
        results.failed.push(invoice._id.toString());
      }
    }

    return NextResponse.json({
      message: `Processed ${invoicesToRemind.length} invoices`,
      remindersSent: results.success.length,
      failed: results.failed.length,
      success: results.success,
      failedIds: results.failed,
    });
  } catch (error: any) {
    console.error("Error sending expiry reminders:", error);
    return NextResponse.json(
      {
        message: "Error sending expiry reminders",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
