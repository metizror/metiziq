import mongoose from "mongoose";

const adminAuthSchema = new mongoose.Schema(
  {
    name: {
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
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email address",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 100,
    },
    role: {
      type: String,
      enum: ["admin", "superadmin"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    currentToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const AdminAuth =
  mongoose.models.AdminAuth ||
  mongoose.model("AdminAuth", adminAuthSchema);
export default AdminAuth;
