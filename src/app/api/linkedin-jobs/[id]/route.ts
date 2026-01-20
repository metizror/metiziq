import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import LinkedinJob from "@/models/linkedinJob.model";
import { verifyAdminToken } from "@/services/jwt.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectToDatabase();
  const tokenVerification = await verifyAdminToken(request);
  if (!tokenVerification.valid) {
    return NextResponse.json(
      { message: "Unauthorized: Invalid or missing JWT token" },
      { status: 401 }
    );
  }

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Job ID is required" },
        { status: 400 }
      );
    }

    // Try to find by _id, id, or job_id
    const job = await LinkedinJob.findOne({
      $or: [
        { _id: id },
        { id: id },
        { job_id: id },
      ],
    }).lean();

    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error("Error fetching LinkedIn job:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch LinkedIn job", error: error.message },
      { status: 500 }
    );
  }
}
