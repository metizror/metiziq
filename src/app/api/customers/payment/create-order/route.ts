import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { requireCustomerAuth } from "../../../../../services/jwt.service";
import Invoice from "../../../../../models/invoice.model";
import CustomerAuth from "../../../../../models/customer_auth.model";
import { sendMail } from "../../../../../services/email.service";
import { getDailyLimitReachedTemplate } from "../../../../../templates/email";
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const random = Math.floor(1000 + Math.random() * 9000); 
    const candidate = `INV-${year}${month}${day}-${random}`;
    const exists = await Invoice.exists({ invoiceNumber: candidate });
    if (!exists) return candidate;
  }

  return `INV-${year}${month}${day}-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireCustomerAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      type,
      itemIds,
      itemCount,
      pricePerItem,
      currency = "USD",
    } = body;

    if (!type || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { message: "Type, itemIds, and itemCount are required" },
        { status: 400 }
      );
    }

    if (type !== "contacts" && type !== "companies") {
      return NextResponse.json(
        { message: "Type must be 'contacts' or 'companies'" },
        { status: 400 }
      );
    }

    const customer = auth.customer;
    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }
    
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
    
    // Check if limit will be exceeded
    if (totalDownloadedToday + itemCount > DAILY_DOWNLOAD_LIMIT) {
      const remaining = DAILY_DOWNLOAD_LIMIT - totalDownloadedToday;
      
      // Send email notification if they've already reached the limit (only once per day)
      if (totalDownloadedToday >= DAILY_DOWNLOAD_LIMIT) {
        // Check if we've already sent the email today
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const customerRecord = await CustomerAuth.findById(customer._id).select('metadata').exec();
        const lastLimitEmailDate = customerRecord?.metadata?.dailyLimitEmailSentDate;
        
        // Send email only if not sent today
        if (lastLimitEmailDate !== today) {
          try {
            const limitEmailHtml = getDailyLimitReachedTemplate({
              customerName: customer.firstName || customer.email.split('@')[0],
            });

            await sendMail({
              to: customer.email,
              subject: "Daily Download Limit Reached",
              html: limitEmailHtml,
            }).catch((err) => {
              console.error("Error sending daily limit email:", err);
            });

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
      }
      
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

    const subtotal = itemCount * pricePerItem;
    const tax = subtotal * 0.1; 
    const total = subtotal + tax;

    const invoiceNumber = await generateInvoiceNumber();

    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: invoiceNumber,
          description: `Purchase of ${itemCount} ${type}`,
          amount: {
            currency_code: currency,
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: subtotal.toFixed(2),
              },
              tax_total: {
                currency_code: currency,
                value: tax.toFixed(2),
              },
            },
          },
          items: [
            {
              name: `${type.charAt(0).toUpperCase() + type.slice(1)} Data`,
              description: `Download ${itemCount} ${type}`,
              quantity: "1",
              unit_amount: {
                currency_code: currency,
                value: subtotal.toFixed(2),
              },
            },
          ],
        },
      ],
      application_context: {
        brand_name: "MarketForce",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/customer/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/customer/payment/cancel`,
      },
    };

    return NextResponse.json({
      success: true,
      invoiceNumber,
      orderData,
      total: total.toFixed(2),
      currency,
    });
  } catch (err: any) {
    console.error("Error creating order:", err);
    return NextResponse.json(
      { message: "Error creating order", error: err.message },
      { status: 500 }
    );
  }
}

