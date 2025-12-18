import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { requireCustomerAuth } from "../../../../../services/jwt.service";
import Invoice from "../../../../../models/invoice.model";

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireCustomerAuth(request);
  if (auth.error) return auth.error;

  try {
    const customer = auth.customer;
    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10)),
      100
    );
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    const query: any = { customerId: customer._id };
    if (status && ["pending", "completed", "failed", "refunded"].includes(status)) {
      query.paymentStatus = status;
    }

    // Add search filter if provided
    if (search) {
      const searchConditions: any[] = [
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
      
      // Try to parse as number for amount search
      const searchNumber = parseFloat(search);
      if (!isNaN(searchNumber)) {
        searchConditions.push({ total: searchNumber });
      }
      
      // Try to parse as date
      const searchDate = new Date(search);
      if (!isNaN(searchDate.getTime())) {
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);
        searchConditions.push({
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        });
      }
      
      if (searchConditions.length > 0) {
        query.$or = searchConditions;
      }
    }

    const [invoices, totalCount, allInvoicesForStats] = await Promise.all([
      Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-metadata")
        .exec(),
      Invoice.countDocuments(query),
      // Get all invoices for summary stats (only if no search/filter)
      !search && !status
        ? Invoice.find({ customerId: customer._id })
            .select("total paymentStatus createdAt")
            .exec()
        : Promise.resolve([]),
    ]);

    // Calculate summary statistics
    const statsInvoices = Array.isArray(allInvoicesForStats) ? allInvoicesForStats : [];
    const totalInvoices = !search && !status ? statsInvoices.length : totalCount;
    const totalPaid = !search && !status
      ? statsInvoices
          .filter((inv: any) => inv.paymentStatus === "completed")
          .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
      : invoices
          .filter((inv: any) => inv.paymentStatus === "completed")
          .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
    const lastPayment = invoices.length > 0 && invoices[0].paymentStatus === "completed"
      ? invoices[0].createdAt
      : null;
    const allPaid = !search && !status
      ? statsInvoices.length > 0 && statsInvoices.every((inv: any) => inv.paymentStatus === "completed")
      : invoices.length > 0 && invoices.every((inv: any) => inv.paymentStatus === "completed");

    return NextResponse.json({
      invoices,
      summary: {
        totalInvoices,
        totalPaid,
        lastPayment,
        allPaid,
      },
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        totalCount,
        limit,
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err: any) {
    console.error("Error fetching invoices:", err);
    return NextResponse.json(
      { message: "Error fetching invoices", error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireCustomerAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { message: "Invoice ID is required" },
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

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    // Verify customer owns this invoice
    if (invoice.customerId.toString() !== customer._id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Increment download count
    invoice.downloadCount = (invoice.downloadCount || 0) + 1;
    await invoice.save();

    return NextResponse.json({
      success: true,
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        downloadUrl: invoice.downloadUrl,
        fileName: invoice.fileName,
        downloadCount: invoice.downloadCount,
      },
    });
  } catch (err: any) {
    console.error("Error updating invoice:", err);
    return NextResponse.json(
      { message: "Error updating invoice", error: err.message },
      { status: 500 }
    );
  }
}
