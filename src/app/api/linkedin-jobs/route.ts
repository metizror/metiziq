import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import LinkedinJob from "@/models/linkedinJob.model";
import { verifyAdminToken } from "@/services/jwt.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const tokenVerification = await verifyAdminToken(request);
  if (!tokenVerification.valid) {
    return NextResponse.json(
      { message: "Unauthorized: Invalid or missing JWT token" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("date_from") || "";
    const dateTo = searchParams.get("date_to") || "";
    const type = searchParams.get("type") || "";
    const remote = searchParams.get("remote") || "";

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.min(Math.max(1, limit), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const query: any = {};

    // Search functionality
    if (search) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { title: searchRegex },
        { organization: searchRegex },
        { location: searchRegex },
        { description_text: searchRegex },
        { job_id: searchRegex },
      ];
    }

    // Date filter functionality
    // date_posted is stored as a string in format "YYYY-MM-DD"
    if (dateFrom || dateTo) {
      query.date_posted = {};
      if (dateFrom) {
        // Format: "YYYY-MM-DD" - string comparison works because format is lexicographically sortable
        query.date_posted.$gte = dateFrom;
      }
      if (dateTo) {
        // Format: "YYYY-MM-DD" - string comparison works because format is lexicographically sortable
        query.date_posted.$lte = dateTo;
      }
    }

    // Employment type filter (employment_type: string[])
    if (type) {
      const types = type
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (types.length > 0) {
        query.employment_type = { $in: types };
      }
    }

    // Remote filter (remote_derived: boolean)
    if (remote === "true") {
      query.remote_derived = true;
    } else if (remote === "false") {
      query.remote_derived = false;
    }

    // Get total count
    const totalCount = await LinkedinJob.countDocuments(query);

    // Fetch jobs with pagination, sorted by created_at descending (newest first)
    const jobs = await LinkedinJob.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const totalPages = Math.ceil(totalCount / limitNumber);

    return NextResponse.json({
      success: true,
      jobs,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching LinkedIn jobs:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch LinkedIn jobs", error: error.message },
      { status: 500 }
    );
  }
}
