import { verifyOtp } from "@/controller/auth.controller";
import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        return await verifyOtp(request);
    } catch (error: any) {
        console.error("Verify OTP route error:", error);
        return NextResponse.json(
            {
                status: 500,
                message: error.message || "Failed to verify OTP",
            },
            { status: 500 }
        );
    }
}