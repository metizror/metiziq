import mongoose from "mongoose";

export interface IInvoice {
  invoiceNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerEmail: string;
  customerName: string;
  type: "contacts" | "companies";
  itemIds: mongoose.Types.ObjectId[];
  itemCount: number;
  pricePerItem: number;
  subtotal: number;
  tax?: number;
  total: number;
  currency: string;
  paymentMethod: "paypal" | "stripe" | "other";
  paymentStatus: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  paymentId?: string; // PayPal transaction ID
  paymentDetails?: {
    payerId?: string;
    payerEmail?: string;
    transactionId?: string;
    paymentDate?: Date;
  };
  downloadToken?: string;
  filePath?: string; // Path to saved Excel file
  fileName?: string; // Name of the Excel file
  downloadUrl?: string; // URL to download the file
  downloadCount?: number; // Number of times downloaded
  expiresAt?: Date; // File expiration date
  expiryReminderSent?: boolean; // Whether expiry reminder email has been sent
  expiredEmailSent?: boolean; // Whether expired email notification has been sent
  metadata?: {
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const invoiceSchema = new mongoose.Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerAuth",
      required: [true, "Customer ID is required"],
      index: true,
    },
    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
    },
    type: {
      type: String,
      enum: ["contacts", "companies"],
      required: [true, "Type is required"],
    },
    itemIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    ],
    itemCount: {
      type: Number,
      required: [true, "Item count is required"],
      min: [1, "Item count must be at least 1"],
    },
    pricePerItem: {
      type: Number,
      required: [true, "Price per item is required"],
      min: [0, "Price per item must be non-negative"],
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal must be non-negative"],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax must be non-negative"],
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total must be non-negative"],
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "CAD", "AUD"],
    },
    paymentMethod: {
      type: String,
      enum: ["paypal", "stripe", "other"],
      required: [true, "Payment method is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    paymentId: {
      type: String,
      index: true,
    },
    paymentDetails: {
      payerId: String,
      payerEmail: String,
      transactionId: String,
      paymentDate: Date,
    },
    downloadToken: {
      type: String,
    },
    filePath: {
      type: String,
    },
    fileName: {
      type: String,
    },
    downloadUrl: {
      type: String,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
    },
    expiryReminderSent: {
      type: Boolean,
      default: false,
    },
    expiredEmailSent: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Generate invoice number before saving
invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model("Invoice").countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const day = String(new Date().getDate()).padStart(2, "0");
    const sequence = String(count + 1).padStart(4, "0");
    this.invoiceNumber = `INV-${year}${month}${day}-${sequence}`;
  }
  next();
});

// Index for efficient queries
invoiceSchema.index({ customerId: 1, createdAt: -1 });
invoiceSchema.index({ paymentStatus: 1, createdAt: -1 });
// invoiceSchema.index({ invoiceNumber: 1 });

const Invoice =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", invoiceSchema);

export default Invoice;

