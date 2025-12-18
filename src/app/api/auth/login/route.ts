import { NextRequest, NextResponse } from "next/server";
import type { LoginPayload } from "@/types/auth.types";

// Route segment config for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // Lazy load imports to avoid module initialization errors on Vercel
    const { loginController } = await import("../../../../controller/auth.controller");
    const { connectToDatabase } = await import("../../../../lib/db");
    
    await connectToDatabase();
    const data = await request.json();
    const response = await loginController(data as LoginPayload);
    return NextResponse.json(response, { status: response.status });
  } catch (error: any) {
    console.error("Login route error:", error);
    return NextResponse.json(
      {
        status: 500,
        message: error.message || "Failed to login",
        customer: null,
        admin: null,
      },
      { status: 500 }
    );
  }
}
