import mongoose from "mongoose";

const customerAuthSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(v)) {
            return false;
          }
          // Business email validation - reject free email providers
          const freeEmailProviders = [
            "gmail.com",
            "yahoo.com",
            "hotmail.com",
            "outlook.com",
            "aol.com",
            "icloud.com",
            "mail.com",
            "protonmail.com",
            "yandex.com",
            "zoho.com",
            "gmx.com",
            "live.com",
            "msn.com",
            "rediffmail.com",
            "inbox.com",
            "rocketmail.com",
            "me.com",
            "mac.com",
          ];
          const domain = v.split("@")[1]?.toLowerCase();
          return !freeEmailProviders.includes(domain);
        },
        message:
          "Only business email addresses are accepted (no Gmail, Yahoo, etc.)",
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 100,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "customer",
    },
    blockedBy: {
      type: String,
      default: null,
    },
    blockedReason: {
      type: String,
    },
    currentToken: {
      type: String,
      default: null,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpiry: {
      type: Date,
      default: null,
    },
    ableToBuyContacts: {
      type: Boolean,
      default: false,
    },
    ableToBuyCompanies: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    dailyContactSuppressionCount: {
      type: Number,
      default: 0,
    },
    dailyCompanySuppressionCount: {
      type: Number,
      default: 0,
    },
    lastSuppressionDate: {
      type: Date,
      default: null,
    },
    billingAddress: {
      streetAddress: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const CustomerAuth =
  mongoose.models.CustomerAuth ||
  mongoose.model("CustomerAuth", customerAuthSchema);
export default CustomerAuth;
