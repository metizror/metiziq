import { NextRequest, NextResponse } from "next/server";
import customerAuthModel from "../../../../models/customer_auth.model";
import Otp from "../../../../models/otp.model";
import { sendMail } from "../../../../services/email.service";
import { connectToDatabase } from "../../../../lib/db";
import bcrypt from "bcryptjs";
import adminAuthModel from "../../../../models/admin_auth.model";


export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
  const { email, step, otp, newPassword, role } = body;

  let user: any;
  let determinedRole: string | null = role || null;

  // If role is not provided, determine it by checking both models
  if (!determinedRole) {
    const customer = await customerAuthModel.findOne({ email });
    if (customer) {
      determinedRole = "customer";
      user = customer;
    } else {
      const admin = await adminAuthModel.findOne({ email });
      if (admin) {
        determinedRole = admin.role; // "admin" or "superadmin"
        user = admin;
      }
    }
    
    if (!user) {
      return NextResponse.json({ message: "User not found with this email" }, { status: 404 });
    }
  } else {
    // Role provided, check the appropriate model
    if (determinedRole === "customer") {
      user = await customerAuthModel.findOne({ email });
      if (!user) {
        return NextResponse.json({ message: "Customer not found" }, { status: 404 });
      }
    } else if (determinedRole === "admin" || determinedRole === "superadmin") {
      user = await adminAuthModel.findOne({ email });
      if (!user) {
        return NextResponse.json({ message: "Admin not found" }, { status: 404 });
      }
    }
  }
  if (step === "send-otp") {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    await sendMail({
      to: email,
      subject: "Forgot Password OTP Verification",
      text: `Your OTP is ${otp}`,
    });
    return NextResponse.json({ 
      message: "OTP sent to email",
      role: determinedRole // Return the determined role
    }, { status: 200 });
  }
  if (step === "verify-otp") {
    if (!otp || !email) {
      return NextResponse.json(
        { message: "OTP and email are required" },
        { status: 400 }
      );
    }
    const otpDoc = await Otp.findOne({ email, otp });
    if (!otpDoc) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    await Otp.deleteMany({ email });
    return NextResponse.json({ 
      message: "OTP verified",
      role: determinedRole // Return the determined role for consistency
    }, { status: 200 });
  }
  if (step === "reset-password") {
    if (!newPassword || !email) {
      return NextResponse.json(
        { message: "New password and email are required" },
        { status: 400 }
      );
    }
    
    // Ensure we have a role (should be determined by now)
    if (!determinedRole) {
      return NextResponse.json(
        { message: "Unable to determine user role. Please try again." },
        { status: 400 }
      );
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    if (determinedRole === "customer") {
      await customerAuthModel.updateOne(
        { email },
        { $set: { password: hashedPassword } }
      );
    } else if (determinedRole === "admin" || determinedRole === "superadmin") {
      await adminAuthModel.updateOne({ email }, { password: hashedPassword });
    }
    await Otp.deleteMany({ email });
    return NextResponse.json({ message: "Password reset" }, { status: 200 });
  }
  return NextResponse.json({ message: "Invalid step" }, { status: 400 });
  } catch (error: any) {
    console.error("Forgot password route error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to process forgot password request" },
      { status: 500 }
    );
  }
}
