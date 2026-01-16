import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectToDatabase } from "../../../../lib/db";
import { requireCustomerAuth } from "../../../../services/jwt.service";
import Invoice from "../../../../models/invoice.model";
import { statSync } from "fs";
import { join } from "path";

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
    const search = searchParams.get("search") || "";

    // Query for active downloads (not expired) - for the downloads list
    const activeDownloadsQuery: any = {
      customerId: customer._id,
      paymentStatus: "completed",
      fileName: { $exists: true, $ne: null },
      downloadUrl: { $exists: true, $ne: null },
      expiresAt: { $gt: new Date() },
    };

    // Query for ALL completed invoices with file information (for summary stats)
    const allInvoicesQuery: any = {
      customerId: customer._id,
      paymentStatus: "completed",
      fileName: { $exists: true, $ne: null },
      downloadUrl: { $exists: true, $ne: null },
    };

    // Add search filter if provided (only affects active downloads list)
    if (search) {
      activeDownloadsQuery.$or = [
        { fileName: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch active downloads for the list
    const [invoices, totalCount] = await Promise.all([
      Invoice.find(activeDownloadsQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("invoiceNumber fileName filePath downloadUrl itemCount type createdAt downloadCount expiresAt")
        .exec(),
      Invoice.countDocuments(activeDownloadsQuery),
    ]);

    // Fetch ALL invoices (including expired) for summary statistics
    const allInvoicesForStats = await Invoice.find(allInvoicesQuery)
      .select("itemCount createdAt")
      .sort({ createdAt: -1 })
      .exec();

    // Enrich invoices with file size information
    const downloads = await Promise.all(
      invoices.map(async (invoice: any) => {
        let fileSize = 0;
        let fileSizeFormatted = "0 MB";

        if (invoice.filePath) {
          try {
            // Check if file exists and get its size
            const stats = statSync(invoice.filePath);
            fileSize = stats.size;
            
            // Format file size with proper units
            if (fileSize === 0) {
              fileSizeFormatted = "0 B";
            } else if (fileSize < 1024) {
              fileSizeFormatted = `${fileSize} B`;
            } else if (fileSize < 1024 * 1024) {
              fileSizeFormatted = `${(fileSize / 1024).toFixed(2)} KB`;
            } else {
              fileSizeFormatted = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
            }
          } catch (error: any) {
            // File might not exist or path is incorrect
            console.error(`Error getting file stats for ${invoice.filePath}:`, error?.message || error);
            // Try to estimate size based on item count if file doesn't exist
            // Rough estimate: ~1KB per contact/company record
            if (invoice.itemCount) {
              const estimatedSize = invoice.itemCount * 1024; // 1KB per item
              if (estimatedSize < 1024 * 1024) {
                fileSizeFormatted = `~${(estimatedSize / 1024).toFixed(2)} KB`;
              } else {
                fileSizeFormatted = `~${(estimatedSize / (1024 * 1024)).toFixed(2)} MB`;
              }
            }
          }
        } else {
          // No file path available, estimate based on item count
          if (invoice.itemCount) {
            const estimatedSize = invoice.itemCount * 1024; // 1KB per item
            if (estimatedSize < 1024 * 1024) {
              fileSizeFormatted = `~${(estimatedSize / 1024).toFixed(2)} KB`;
            } else {
              fileSizeFormatted = `~${(estimatedSize / (1024 * 1024)).toFixed(2)} MB`;
            }
          }
        }

        // Determine file type from extension
        const fileType = invoice.fileName?.endsWith(".csv") ? "csv" : "xlsx";

        const isExpired = invoice.expiresAt && new Date(invoice.expiresAt).getTime() < Date.now();

        return {
          id: invoice._id.toString(),
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          fileName: invoice.fileName || "",
          downloadUrl: invoice.downloadUrl || "",
          date: invoice.createdAt || new Date(),
          contacts: invoice.itemCount || 0,
          size: fileSizeFormatted,
          sizeBytes: fileSize,
          status: isExpired ? "Expired" : "Completed",
          type: fileType,
          downloadCount: invoice.downloadCount || 0,
          expiresAt: invoice.expiresAt,
        };
      })
    );

    // Calculate summary statistics from ALL invoices (including expired) to preserve history
    const statsInvoices = Array.isArray(allInvoicesForStats) ? allInvoicesForStats : [];
    const totalDownloads = statsInvoices.length;
    const totalContacts = statsInvoices.reduce((sum: number, inv: any) => sum + (inv.itemCount || 0), 0);
    const lastDownload = statsInvoices.length > 0 
      ? (statsInvoices[0].createdAt || null)
      : null;

    return NextResponse.json({
      downloads,
      summary: {
        totalDownloads,
        totalContacts,
        lastDownload,
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
    console.error("Error fetching downloads:", err);
    return NextResponse.json(
      { message: "Error fetching downloads", error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireCustomerAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");

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

    // Save file path before clearing it
    const filePathToDelete = invoice.filePath;

    // Remove file information only (soft delete) – keep invoice and payment details intact
    invoice.fileName = undefined;
    invoice.filePath = undefined;
    invoice.downloadUrl = undefined;
    invoice.downloadToken = undefined;
    invoice.expiresAt = undefined;
    await invoice.save();

    // Optionally delete the physical file
    if (filePathToDelete) {
      try {
        const { unlink } = await import("fs/promises");
        await unlink(filePathToDelete);
      } catch (error) {
        console.error(`Error deleting file ${filePathToDelete}:`, error);
        // Continue even if file deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Download file deleted successfully",
    });
  } catch (err: any) {
    console.error("Error deleting download:", err);
    return NextResponse.json(
      { message: "Error deleting download", error: err.message },
      { status: 500 }
    );
  }
}
