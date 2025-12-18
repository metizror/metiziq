import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 300 } } // 300 sec = 5 min
});

const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export default Otp;
