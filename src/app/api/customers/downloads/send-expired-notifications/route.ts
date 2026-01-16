import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "../../../../../lib/db";
import Invoice from "../../../../../models/invoice.model";
import { sendMail } from "../../../../../services/email.service";
import { getDownloadExpiredTemplate } from "../../../../../templates/email";

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

    // Find invoices that:
    // 1. Have completed payment status
    // 2. Have expired (expiresAt is in the past)
    // 3. Haven't had the expired email sent yet
    // 4. Have file name (to identify the file)
    // 5. Expired within the last 24 hours (to avoid sending emails for very old expired files)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const expiredInvoices = await Invoice.find({
      paymentStatus: "completed",
      expiresAt: {
        $lt: now, // Expired (in the past)
        $gte: oneDayAgo, // But not too old (within last 24 hours)
      },
      expiredEmailSent: { $ne: true },
      fileName: { $exists: true, $ne: null },
    })
      .select("customerName customerEmail fileName expiresAt")
      .exec();

    if (expiredInvoices.length === 0) {
      return NextResponse.json({
        message: "No expired invoices need notifications at this time",
        notificationsSent: 0,
      });
    }

    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    // Send expired notification emails
    for (const invoice of expiredInvoices) {
      try {
        const expiredEmailHtml = getDownloadExpiredTemplate({
          customerName: invoice.customerName.split(" ")[0] || invoice.customerName,
          fileName: invoice.fileName || "your file",
        });

        await sendMail({
          to: invoice.customerEmail,
          subject: "Your Download Link Has Expired",
          html: expiredEmailHtml,
        });

        // Mark expired email as sent
        await Invoice.updateOne(
          { _id: invoice._id },
          { $set: { expiredEmailSent: true } }
        );

        results.success.push(invoice._id.toString());
      } catch (error: any) {
        console.error(
          `Error sending expired notification for invoice ${invoice._id}:`,
          error
        );
        results.failed.push(invoice._id.toString());
      }
    }

    return NextResponse.json({
      message: `Processed ${expiredInvoices.length} expired invoices`,
      notificationsSent: results.success.length,
      failed: results.failed.length,
      success: results.success,
      failedIds: results.failed,
    });
  } catch (error: any) {
    console.error("Error sending expired notifications:", error);
    return NextResponse.json(
      {
        message: "Error sending expired notifications",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Also allow GET for manual triggering or cron job setup
export async function GET(request: NextRequest) {
  return POST(request);
}
