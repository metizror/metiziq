import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../../../lib/db";
import { requireCustomerAuth } from "../../../../../../../services/jwt.service";
import Invoice from "../../../../../../../models/invoice.model";
import Activity from "../../../../../../../models/activity.model";
import { jsPDF } from "jspdf";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
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

    const invoiceId = params.invoiceId;

    if (!invoiceId) {
      return NextResponse.json(
        { message: "Invoice ID is required" },
        { status: 400 }
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

    // Generate PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });

    // Company Information
    const companyName = "AMFACCESS";
    const companyAddress = "5273 Prospect Rd #305, San Jose, CA 95129 USA";
    const companyEmail = "support@amfaccess.com";

    // Colors (RGB values for jsPDF)
    const darkGray = [51, 51, 51];
    const lightBlue = [74, 144, 226];
    const lightGray = [102, 102, 102];

    // Load and add company logo image at the very top-left
    const logoTopY = 20; // Top margin
    const logoWidth = 180; // Logo width in points
    const logoHeight = 50; // Estimated logo height (adjust based on actual logo)

    try {
      // Try multiple possible paths for the image
      const possiblePaths = [
        join(process.cwd(), 'src', 'assets', 'cf01cb1f3c35e00a009f17e0c1fd4855e8cb9ad1.png'),
        join(process.cwd(), 'public', 'assets', 'cf01cb1f3c35e00a009f17e0c1fd4855e8cb9ad1.png'),
        join(__dirname, '..', '..', '..', '..', '..', '..', '..', 'assets', 'cf01cb1f3c35e00a009f17e0c1fd4855e8cb9ad1.png'),
      ];

      let imageBuffer: Buffer | null = null;
      for (const imagePath of possiblePaths) {
        try {
          imageBuffer = await readFile(imagePath);
          break;
        } catch (err) {
          // Try next path
          continue;
        }
      }

      if (imageBuffer) {
        const imageBase64 = imageBuffer.toString('base64');
        const imageDataUrl = `data:image/png;base64,${imageBase64}`;

        // Add image to PDF at the very top-left
        doc.addImage(imageDataUrl, 'PNG', 50, logoTopY, logoWidth, logoHeight);
      } else {
        throw new Error('Image file not found in any expected location');
      }
    } catch (imageError) {
      console.error('Error loading logo image:', imageError);
      // Fallback to text if image fails to load
      doc.setFontSize(24);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text('AMFACCESS', 50, logoTopY + 20);
    }

    // Company Information on the RIGHT side (aligned with logo)
    const companyInfoStartY = logoTopY + 10; // Aligned with logo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(companyName, 500, companyInfoStartY, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(companyAddress, 500, companyInfoStartY + 20, { align: 'right' });
    doc.text(companyEmail, 500, companyInfoStartY + 35, { align: 'right' });

    // Invoice Title - positioned below logo
    const invoiceTitleY = logoTopY + logoHeight + 25; // 25pt spacing after logo
    doc.setFontSize(18);
    doc.setTextColor(lightBlue[0], lightBlue[1], lightBlue[2]);
    doc.text('INVOICE', 50, invoiceTitleY);

    // Invoice Details (Right Side)
    const invoiceDate = invoice.createdAt
      ? new Date(invoice.createdAt).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      })
      : new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });

    const dueDate = invoice.paymentDetails?.paymentDate
      ? new Date(invoice.paymentDetails.paymentDate).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      })
      : invoiceDate;

    // Invoice Details (Right Side) - aligned with invoice title
    doc.setFontSize(10);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(`INVOICE # ${invoice.invoiceNumber}`, 500, invoiceTitleY, { align: 'right' });
    doc.text(`DATE ${invoiceDate}`, 500, invoiceTitleY + 20, { align: 'right' });
    doc.text(`DUE DATE ${dueDate}`, 500, invoiceTitleY + 35, { align: 'right' });
    doc.text('TERMS Due on receipt', 500, invoiceTitleY + 50, { align: 'right' });

    // Bill To Section - positioned below invoice title/details
    const billToStartY = invoiceTitleY + 50; // 50pt spacing after invoice title/details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('BILL TO', 50, billToStartY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(invoice.customerName, 50, billToStartY + 20);

    doc.setFontSize(10);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    // Check if customer has address info, otherwise use email
    const customerAddress = invoice.customerEmail || '';
    doc.text(customerAddress, 50, billToStartY + 40);

    // Line separator - below Bill To section
    const separatorY = billToStartY + 60;
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setLineWidth(0.5);
    doc.line(50, separatorY, 550, separatorY);

    // Table Header - below separator
    const tableTop = separatorY + 20;

    // Table header background (light blue rectangle)
    doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
    doc.rect(50, tableTop - 15, 500, 20, 'F');

    // Table header text (white on blue background)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text
    doc.text('DESCRIPTION', 50, tableTop);
    doc.text('QTY', 350, tableTop, { align: 'right' });
    doc.text('RATE', 420, tableTop, { align: 'right' });
    doc.text('AMOUNT', 490, tableTop, { align: 'right' });

    // Table Header Line (bottom border)
    doc.setDrawColor(lightBlue[0], lightBlue[1], lightBlue[2]);
    doc.setLineWidth(1);
    doc.line(50, tableTop + 5, 550, tableTop + 5);

    // Line Items
    let currentY = tableTop + 35;
    const lineHeight = 25;

    // Determine item description based on type
    const itemDescription = invoice.type === 'contacts'
      ? 'Downloaded Contacts'
      : 'Downloaded Companies';

    const itemQty = invoice.itemCount || 0;
    const itemRate = invoice.pricePerItem || 0;
    const itemAmount = invoice.subtotal || 0;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(itemDescription, 50, currentY);
    doc.text(itemQty.toString(), 350, currentY, { align: 'right' });
    doc.text(`$${itemRate.toFixed(2)}`, 420, currentY, { align: 'right' });
    doc.text(`$${itemAmount.toFixed(2)}`, 490, currentY, { align: 'right' });

    currentY += lineHeight;

    // Dotted line separator
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([5, 5], 0);
    doc.line(50, currentY + 10, 550, currentY + 10);
    doc.setLineDashPattern([], 0);

    // Summary Section
    currentY += 30;
    const balanceDue = invoice.total || 0;
    const paid = invoice.paymentStatus === 'completed' ? balanceDue : 0;
    const amountDue = balanceDue - paid;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('BALANCE DUE', 400, currentY, { align: 'right' });
    doc.text(`$${balanceDue.toFixed(2)}`, 550, currentY, { align: 'right' });

    currentY += 20;
    doc.setFont('helvetica', 'normal');
    doc.text('Paid', 400, currentY, { align: 'right' });
    doc.text(`$${paid.toFixed(2)}`, 550, currentY, { align: 'right' });

    currentY += 20;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Amount Due', 400, currentY, { align: 'right' });
    doc.text(`$${amountDue.toFixed(2)}`, 550, currentY, { align: 'right' });

    // Payment Details Section
    currentY += 40;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Payments', 50, currentY);

    currentY += 20;
    if (invoice.paymentDetails?.paymentDate && invoice.paymentStatus === 'completed') {
      const paymentDate = new Date(invoice.paymentDetails.paymentDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const paymentMethod = invoice.paymentMethod === 'paypal'
        ? 'PayPal'
        : invoice.paymentMethod === 'stripe'
          ? 'Visa'
          : invoice.paymentMethod;

      const lastFour = invoice.paymentDetails.transactionId
        ? invoice.paymentDetails.transactionId.slice(-4)
        : '****';

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(`${paymentDate} $${paid.toFixed(2)} Payment from ${paymentMethod} ... ${lastFour}`, 50, currentY);
    }

    currentY += 30;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Notes', 50, currentY);

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('All amounts in United States Dollars (USD)', 50, pageHeight - 50);

    // Generate PDF buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // Log Activity
    try {
      if (customer) {
        await Activity.create({
          userId: customer._id,
          user: `${customer.firstName} ${customer.lastName}`,
          action: "Downloaded invoice",
          details: `Invoice #${invoice.invoiceNumber}`,
        });
      }
    } catch (logError) {
      console.error("Error logging invoice download activity:", logError);
    }

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice_${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("Error generating PDF:", err);
    console.error("Error stack:", err.stack);
    return NextResponse.json(
      {
        message: "Error generating PDF",
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}
