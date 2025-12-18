import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { requireCustomerAuth } from "../../../../../services/jwt.service";
import Invoice from "../../../../../models/invoice.model";
import CustomerAuth from "../../../../../models/customer_auth.model";
import Activity from "../../../../../models/activity.model";
import Contacts from "../../../../../models/contacts.model";
import Companies from "../../../../../models/companies.model";
import mongoose from "mongoose";
import * as XLSX from "xlsx";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { sendMail } from "../../../../../services/email.service";
import {
  getPaymentSuccessUserTemplate,
  getPaymentSuccessAdminTemplate,
  getPaymentFailedUserTemplate,
  getPaymentFailedAdminTemplate,
  getFileReadyUserTemplate,
  getDailyLimitReachedTemplate,
} from "../../../../../templates/email";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const auth: any = await requireCustomerAuth(request);
  if (auth.error) return auth.error;
  const customer = auth.customer;
  if (!customer) {
    return NextResponse.json(
      { message: "Customer not found" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const {
      invoiceNumber,
      paymentId,
      payerId,
      payerEmail,
      transactionId,
      paymentStatus,
      type,
      itemIds,
      itemCount,
      pricePerItem,
      currency = "USD",
      errorMessage,
    } = body;

    if (!invoiceNumber || !type || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { message: "invoiceNumber, type, and itemIds are required" },
        { status: 400 }
      );
    }

    if (type !== "contacts" && type !== "companies") {
      return NextResponse.json(
        { message: "Type must be 'contacts' or 'companies'" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "completed", "failed", "cancelled"];
    const status = paymentStatus && validStatuses.includes(paymentStatus.toLowerCase())
      ? paymentStatus.toLowerCase()
      : "pending";


    if (status === "completed") {
      const DAILY_DOWNLOAD_LIMIT = 10000;

      const now = new Date();
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

      const todayInvoices = await Invoice.find({
        customerId: customer._id,
        paymentStatus: "completed",
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }).select("itemCount").exec();

      const totalDownloadedToday = todayInvoices.reduce((sum: number, inv: any) => {
        return sum + (inv.itemCount || 0);
      }, 0);

      if (totalDownloadedToday + itemCount > DAILY_DOWNLOAD_LIMIT) {
        const remaining = DAILY_DOWNLOAD_LIMIT - totalDownloadedToday;
        return NextResponse.json(
          {
            message: `Daily download limit exceeded. You have downloaded ${totalDownloadedToday} items today. Maximum allowed is ${DAILY_DOWNLOAD_LIMIT} per day. ${remaining > 0 ? `You can still download up to ${remaining} more items today.` : "Please try again tomorrow."}`,
            error: "DAILY_LIMIT_EXCEEDED",
            dailyLimit: DAILY_DOWNLOAD_LIMIT,
            downloadedToday: totalDownloadedToday,
            remainingToday: remaining,
            requestedCount: itemCount,
          },
          { status: 429 }
        );
      }
    }

    const subtotal = itemCount * pricePerItem;
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    let invoice = await Invoice.findOne({ invoiceNumber });

    if (invoice) {
      invoice.paymentStatus = status as "pending" | "completed" | "failed" | "cancelled";
      if (paymentId) invoice.paymentId = paymentId;
      if (payerId || payerEmail || transactionId) {
        invoice.paymentDetails = {
          ...invoice.paymentDetails,
          payerId: payerId || invoice.paymentDetails?.payerId,
          payerEmail: payerEmail || invoice.paymentDetails?.payerEmail,
          transactionId: transactionId || invoice.paymentDetails?.transactionId,
          paymentDate: new Date(),
        };
      }
      if (errorMessage) {
        invoice.metadata = {
          ...invoice.metadata,
          errorMessage,
        };
      }
    } else {
      invoice = await Invoice.create({
        invoiceNumber,
        customerId: customer._id,
        customerEmail: customer.email,
        customerName: `${customer.firstName} ${customer.lastName}`,
        type,
        itemIds,
        itemCount,
        pricePerItem,
        subtotal,
        tax,
        total,
        currency,
        paymentMethod: "paypal",
        paymentStatus: status as "pending" | "completed" | "failed" | "cancelled",
        paymentId: paymentId || undefined,
        paymentDetails: {
          payerId,
          payerEmail,
          transactionId,
          paymentDate: new Date(),
        },
        metadata: errorMessage ? { errorMessage } : {},
      });
    }

    if (status === "completed") {
      const objectIds = itemIds.map(
        (id: string) => new mongoose.Types.ObjectId(id)
      );

      let items: any[] = [];
      if (type === "contacts") {
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
        const itemObj = item.toObject();
        delete itemObj._id;
        delete itemObj.__v;
        delete itemObj.createdAt;
        delete itemObj.updatedAt;
        return itemObj;
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, invoice.type);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${invoice.invoiceNumber}_${invoice.type}_${timestamp}.xlsx`;
      const downloadToken = randomUUID();

      const tmpDir = "/tmp";
      const customerDir = join(tmpDir, "downloads", customer._id.toString());
      await mkdir(customerDir, { recursive: true });

      const filePath = join(customerDir, fileName);
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      await writeFile(filePath, buffer);

      invoice.filePath = filePath;
      invoice.fileName = fileName;
      invoice.downloadToken = downloadToken;
      invoice.downloadUrl = `/api/customers/downloads/file?invoiceId=${invoice._id}&token=${downloadToken}`;
      invoice.downloadCount = 0;
      invoice.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const updateFields: Record<string, boolean> = {};
      if (type === "contacts") {
        updateFields.ableToBuyContacts = true;
      } else if (type === "companies") {
        updateFields.ableToBuyCompanies = true;
      }

      if (Object.keys(updateFields).length > 0) {
        await CustomerAuth.updateOne(
          { _id: customer._id },
          { $set: updateFields }
        );
      }
    }

    await invoice.save();

    const adminEmail = process.env.ADMIN_EMAIL || "umesh.dangar@metizsoft.com";
    const formattedDate = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(total);

    if (status === "completed") {
      const baseUrl = "https://a-market-force-frontend.vercel.app/customer/downloads";

      const userSuccessEmailHtml = getPaymentSuccessUserTemplate({
        customerName: customer.firstName,
        formattedAmount,
        itemCount,
        type,
        downloadUrl: baseUrl,
      });

      const adminSuccessEmailHtml = getPaymentSuccessAdminTemplate({
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        invoiceNumber: invoice.invoiceNumber,
        formattedAmount,
        itemCount,
        type,
        transactionId: transactionId || paymentId || null,
        formattedDate,
      });

      const fileReadyEmailHtml = getFileReadyUserTemplate({
        customerName: customer.firstName,
        recordCount: itemCount,
        downloadUrl: baseUrl,
      });

      // Log Activity
      try {
        await Activity.create({
          userId: customer._id,
          user: `${customer.firstName} ${customer.lastName}`,
          action: "Payment processed successfully",
          details: `Invoice #${invoice.invoiceNumber}`,
        });
      } catch (logError) {
        console.error("Error logging payment activity:", logError);
      }

      // Check if daily limit has been reached after this purchase
      const DAILY_DOWNLOAD_LIMIT = 10000;
      const now = new Date();
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

      const todayInvoicesAfterPurchase = await Invoice.find({
        customerId: customer._id,
        paymentStatus: "completed",
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }).select("itemCount").exec();

      const totalDownloadedTodayAfterPurchase = todayInvoicesAfterPurchase.reduce((sum: number, inv: any) => {
        return sum + (inv.itemCount || 0);
      }, 0);

      // Check if limit has been reached (>= 10000) and send email if not already sent today
      const hasReachedLimit = totalDownloadedTodayAfterPurchase >= DAILY_DOWNLOAD_LIMIT;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const customerRecord = await CustomerAuth.findById(customer._id).select('metadata').exec();
      const lastLimitEmailDate = customerRecord?.metadata?.dailyLimitEmailSentDate;

      const emailPromises = [
        sendMail({
          to: customer.email,
          subject: `Payment Confirmed – Your File is Ready to Download`,
          html: userSuccessEmailHtml,
        }).catch((err) => console.error("Error sending user success email:", err)),
        sendMail({
          to: adminEmail,
          subject: `Payment Received - ${customer.firstName} ${customer.lastName}`,
          html: adminSuccessEmailHtml,
        }).catch((err) => console.error("Error sending admin success email:", err)),
        sendMail({
          to: customer.email,
          subject: `Your AMFAccess File is Ready`,
          html: fileReadyEmailHtml,
        }).catch((err) => console.error("Error sending file ready email:", err)),
      ];

      // Send daily limit reached email if limit is reached and email hasn't been sent today
      if (hasReachedLimit && lastLimitEmailDate !== today) {
        try {
          const limitEmailHtml = getDailyLimitReachedTemplate({
            customerName: customer.firstName || customer.email.split('@')[0],
          });

          emailPromises.push(
            sendMail({
              to: customer.email,
              subject: "Daily Download Limit Reached",
              html: limitEmailHtml,
            }).catch((err) => console.error("Error sending daily limit email:", err))
          );

          // Mark email as sent today
          await CustomerAuth.updateOne(
            { _id: customer._id },
            {
              $set: {
                'metadata.dailyLimitEmailSentDate': today
              }
            }
          );
        } catch (error: any) {
          console.error("Error sending daily limit notification:", error);
        }
      }

      Promise.all(emailPromises);
    } else if (status === "failed") {
      const baseUrl = "https://a-market-force-frontend.vercel.app/customer/invoices";

      const userFailureEmailHtml = getPaymentFailedUserTemplate({
        customerName: customer.firstName,
        paymentLink: baseUrl,
      });

      const adminFailureEmailHtml = getPaymentFailedAdminTemplate({
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        invoiceNumber: invoice.invoiceNumber,
        formattedAmount,
        itemCount,
        type,
        formattedDate,
        errorMessage,
      });

      Promise.all([
        sendMail({
          to: customer.email,
          subject: `Payment Failed – Action Needed`,
          html: userFailureEmailHtml,
        }).catch((err) => console.error("Error sending user failure email:", err)),
        sendMail({
          to: adminEmail,
          subject: `Payment Failed - ${customer.firstName} ${customer.lastName}`,
          html: adminFailureEmailHtml,
        }).catch((err) => console.error("Error sending admin failure email:", err)),
      ]);
    }

    const response: any = {
      success: status === "completed",
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        currency: invoice.currency,
        paymentStatus: invoice.paymentStatus,
      },
    };

    if (status === "completed") {
      response.message = "Payment verified and file generated successfully";
      response.invoice.downloadUrl = invoice.downloadUrl;
      response.invoice.fileName = invoice.fileName;
    } else if (status === "failed") {
      response.message = "Payment failed. Please try again.";
    } else if (status === "cancelled") {
      response.message = "Payment was cancelled.";
    } else {
      response.message = "Payment is pending. Please wait for confirmation.";
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Error verifying payment:", err);
    return NextResponse.json(
      { message: "Error verifying payment", error: err.message },
      { status: 500 }
    );
  }
}

