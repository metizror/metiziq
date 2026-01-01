import mongoose from "mongoose";

const userSyncLimitsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      ref: "AdminAuth",
      unique: true,
    },
    monthlyLimit: {
      type: Number,
      required: [true, "Monthly limit is required"],
      default: 0,
      min: 0,
    },
    currentMonthCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminAuth",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminAuth",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
userSyncLimitsSchema.index({ userId: 1 });

// Method to reset monthly count if it's a new month
userSyncLimitsSchema.methods.checkAndResetMonthlyCount = function () {
  const now = new Date();
  const lastReset = new Date(this.lastResetDate);
  
  // Check if it's a new month
  if (
    now.getFullYear() > lastReset.getFullYear() ||
    now.getMonth() > lastReset.getMonth()
  ) {
    this.currentMonthCount = 0;
    this.lastResetDate = now;
    return true; // Count was reset
  }
  return false; // Count was not reset
};

const UserSyncLimits =
  mongoose.models.UserSyncLimits ||
  mongoose.model("UserSyncLimits", userSyncLimitsSchema);

export default UserSyncLimits;

