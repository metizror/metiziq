import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "../../../../services/jwt.service";
import { connectToDatabase } from "../../../../lib/db";
import Activity from "../../../../models/activity.model";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;
  await connectToDatabase();
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const skip = (page - 1) * limit;
    const totalActivities = await Activity.countDocuments();
    const totalPages = Math.ceil(totalActivities / limit);
    const activities = await Activity.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    return NextResponse.json(
      {
        activities,
        pagination: {
          currentPage: page,
          totalPages,
          totalActivities,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
