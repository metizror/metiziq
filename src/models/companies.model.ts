import mongoose from "mongoose";

const companiesSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
    },
    allDetails:{
      type: mongoose.Schema.Types.Mixed
    },
    createdBy: {
      type: String,
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

const Companies =
  mongoose.models.Companies || mongoose.model("Companies", companiesSchema);
export default Companies;
