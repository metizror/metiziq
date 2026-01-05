import mongoose from "mongoose";

const contactsSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    jobTitle: {
      type: String,
    },
    fullName: {
      type: String,
    },
    jobLevel: {
      type: String,
    },
    jobRole: {
      type: String,
    },
    email: {
      type: String,
      // unique: true,
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
    contactOwner: { type: String },
    mobilePhone: { type: String },
    emailOptOut: { type: Boolean, default: false },
    tag: { type: String },
    description: { type: String },
    modifiedBy: { type: String },
    createdTime: { type: Date },
    modifiedTime: { type: Date },
    lastActivityTime: { type: Date },
    contactName: { type: String },
    unsubscribedMode: { type: String },
    unsubscribedTime: { type: Date },
    mailingStreet: { type: String },
    mailingCity: { type: String },
    mailingState: { type: String },
    mailingCountry: { type: String },
    mailingZip: { type: String },
    companyName: {
      type: String,
    },
    employeeSize: {
      type: String,
    },
    revenue: {
      type: String,
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
    linkedInData: {
      type: mongoose.Schema.Types.Mixed
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    syncDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

const Contacts =
  mongoose.models.Contacts || mongoose.model("Contacts", contactsSchema);
export default Contacts;
