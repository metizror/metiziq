import mongoose from "mongoose";

export interface ISupport {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}

const supportSchema: mongoose.Schema<ISupport> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      minlength: [20, "Message must be at least 20 characters long"],
    },
  },
  { timestamps: true }
);

const Support =
  mongoose.models.Support || mongoose.model("Support", supportSchema);
export default Support;
