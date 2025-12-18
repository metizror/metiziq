import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import Otp from "../../../../models/otp.model";
import { sendMail } from "../../../../services/email.service";
import customerAuthModel from "../../../../models/customer_auth.model";
import adminAuthModel from "../../../../models/admin_auth.model";


export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
        return NextResponse.json({ message: "Email and role are required" }, { status: 400 });
    }
    let user: any;
    if (role === "customer") {
        user = await customerAuthModel.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: "Customer not found" }, { status: 404 });
        }
    } else if (role === "admin" || role === "superadmin") {
        user = await adminAuthModel.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: "Admin or superadmin not found" }, { status: 404 });
        }
    } else {
        return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    await sendMail({
        to: email,
        subject: "Resend OTP",
        text: `Your OTP is ${otp}`,
    });
    return NextResponse.json({ message: "OTP sent to email" }, { status: 200 });
    } catch (error: any) {
        console.error("Resend OTP route error:", error);
        return NextResponse.json(
            { message: error.message || "Failed to resend OTP" },
            { status: 500 }
        );
    }
}