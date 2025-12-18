import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import Invoice from "../../../../../models/invoice.model";
import Contacts from "../../../../../models/contacts.model";
import Companies from "../../../../../models/companies.model";
import mongoose from "mongoose";
import * as XLSX from "xlsx";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { sendMail } from "../../../../../services/email.service";
import { getDownloadExpiredTemplate } from "../../../../../templates/email";
import Activity from "../../../../../models/activity.model";

// Ensure this route is always dynamic and can access /tmp
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await connectToDatabase();
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");
    const token = searchParams.get("token");

    if (!invoiceId || !token) {
      return NextResponse.json(
        { message: "Invoice ID and token are required" },
        { status: 400 }
      );
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, downloadToken: token });
    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found or token invalid" },
        { status: 404 }
      );
    }

    // Check expiry (7 days)
    if (invoice.expiresAt && new Date(invoice.expiresAt).getTime() < Date.now()) {
      // Send expired email notification if not already sent
      if (!invoice.expiredEmailSent && invoice.fileName) {
        try {
          const expiredEmailHtml = getDownloadExpiredTemplate({
            customerName: invoice.customerName.split(" ")[0] || invoice.customerName,
            fileName: invoice.fileName || "your file",
          });

          await sendMail({
            to: invoice.customerEmail,
            subject: "Your Download Link Has Expired",
            html: expiredEmailHtml,
          }).catch((err) => {
            console.error("Error sending expired email:", err);
          });

          // Mark expired email as sent
          invoice.expiredEmailSent = true;
        } catch (error: any) {
          console.error("Error sending expired notification:", error);
        }
      }

      // Clear file metadata to prevent further use
      invoice.filePath = undefined;
      invoice.fileName = undefined;
      invoice.downloadUrl = undefined;
      invoice.downloadToken = undefined;
      await invoice.save();
      return NextResponse.json(
        { message: "Download link expired (7 days)" },
        { status: 410 }
      );
    }

    // Always regenerate the Excel on-demand (avoid relying on filesystem)
    const objectIds = (invoice.itemIds || []).map(
      (id: string) => new mongoose.Types.ObjectId(id)
    );

    let items: any[] = [];
    if (invoice.type === "contacts") {
      items = await Contacts.find({ _id: { $in: objectIds } }).exec();
    } else {
      items = await Companies.find({ _id: { $in: objectIds } }).exec();
    }

    if (items.length === 0) {
      return NextResponse.json(
        { message: "No items found for this invoice" },
        { status: 404 }
      );
    }

    const workbook = XLSX.utils.book_new();
    const worksheetData = items.map((item) => {
      const obj = item.toObject ? item.toObject() : item;
      delete obj._id;
      delete obj.__v;
      delete obj.createdAt;
      delete obj.updatedAt;
      return obj;
    });
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, invoice.type || "data");

    const fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

    // Log Activity
    try {
      await Activity.create({
        userId: invoice.customerId,
        user: invoice.customerName,
        action: `Downloaded ${invoice.itemCount} ${invoice.type}`,
        details: `File: ${invoice.fileName}`,
      });

      // Increment download count (optional but good practice)
      invoice.downloadCount = (invoice.downloadCount || 0) + 1;
      await invoice.save();
    } catch (logError) {
      console.error("Error logging download activity:", logError);
    }

    // Return file as download
    const fileUint8 = new Uint8Array(fileBuffer);
    return new NextResponse(fileUint8, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${invoice.fileName}"`,
        "Content-Length": fileUint8.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("Error serving download file:", err);
    return NextResponse.json(
      { message: "Error serving file", error: err.message },
      { status: 500 }
    );
  }
}
