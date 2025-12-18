import mongoose from "mongoose";

const contactsSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return v.length > 0;
        },
        message: "First name is required",
      },
    },
    lastName: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return v.length > 0;
        },
        message: "Last name is required",
      },
    },
    jobTitle: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return v.length > 0;
        },
        message: "Job title is required",
      },
    },
    fullName: {
      type: String,
      required: true,
    },
    jobLevel: {
      type: String,
    },
    jobRole: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v: string) {
          return v.length > 0;
        },
        message: "Email is required",
      },
    },
    phone: {
      type: String,
    },
    directPhone: {
      type: String,
    },
    address1: {
      type: String,
    },
    address2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    country: {
      type: String,
    },
    otherCountry: {
      type: String,
      trim: true,
      required: function (this: any) {
        return this.country === "Other";
      },
    },
    website: {
      type: String,
    },
    industry: {
      type: String,
    },
    otherIndustry: {
      type: String,
      trim: true,
      required: function (this: any) {
        return this.industry === "Other";
      },
    },
    subIndustry: {
      type: String,
    },
    contactLinkedIn: {
      type: String,
    },
    lastUpdateDate: {
      type: Date,
    },
    companyName: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return v.length > 0;
        },
        message: "Company name is required",
      },
    },
    employeeSize: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return v.length > 0;
        },
        message: "Employee size is required",
      },
    },
    revenue: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return v.length > 0;
        },
        message: "Revenue is required",
      },
    },
    amfNotes: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      default: null,
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      required: [true, "Uploader ID is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Contacts =
  mongoose.models.Contacts || mongoose.model("Contacts", contactsSchema);
export default Contacts;
