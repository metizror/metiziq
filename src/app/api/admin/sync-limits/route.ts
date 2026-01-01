import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import UserSyncLimits from "@/models/user_sync_limits.model";
import AdminAuth from "@/models/admin_auth.model";
import { verifyAdminToken } from "../../../../services/jwt.service";

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const tokenVerification: any = await verifyAdminToken(request);
  
  if (!tokenVerification.valid) {
    return NextResponse.json(
      { message: "Unauthorized: Invalid or missing JWT token" },
      { status: 401 }
    );
  }

  try {
    // Superadmin can see all users' limits, regular admin can only see their own
    if (tokenVerification.admin?.role === "superadmin") {
      // Get all users with their sync limits
      const allLimits = await UserSyncLimits.find({})
        .populate("userId", "name email role")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .sort({ createdAt: -1 });

      // Also get users without limits set
      const allUsers = await AdminAuth.find({ role: { $ne: "superadmin" } })
        .select("_id name email role")
        .sort({ name: 1 });

      const usersWithLimits = allLimits.map((limit: any) => ({
        userId: limit.userId?._id?.toString() || limit.userId,
        userName: limit.userId?.name || "Unknown",
        userEmail: limit.userId?.email || "Unknown",
        monthlyLimit: limit.monthlyLimit,
        currentMonthCount: limit.currentMonthCount,
        lastResetDate: limit.lastResetDate,
        createdAt: limit.createdAt,
        updatedAt: limit.updatedAt,
        createdBy: limit.createdBy?.name || "Unknown",
        updatedBy: limit.updatedBy?.name || "Unknown",
      }));

      const usersWithoutLimits = allUsers
        .filter((user: any) => {
          const userId = user._id?.toString();
          return !allLimits.some((limit: any) => 
            limit.userId?._id?.toString() === userId || limit.userId?.toString() === userId
          );
        })
        .map((user: any) => ({
          userId: user._id?.toString(),
          userName: user.name || "Unknown",
          userEmail: user.email || "Unknown",
          monthlyLimit: 0,
          currentMonthCount: 0,
          lastResetDate: null,
          createdAt: null,
          updatedAt: null,
          createdBy: null,
          updatedBy: null,
        }));

      return NextResponse.json({
        limits: [...usersWithLimits, ...usersWithoutLimits],
      });
    } else {
      // Regular admin can only see their own limit
      const userId = tokenVerification.admin?._id;
      const userLimit = await UserSyncLimits.findOne({ userId })
        .populate("userId", "name email role")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      if (!userLimit) {
        return NextResponse.json({
          limit: {
            userId: userId?.toString(),
            userName: tokenVerification.admin?.name || "Unknown",
            userEmail: tokenVerification.admin?.email || "Unknown",
            monthlyLimit: 0,
            currentMonthCount: 0,
            lastResetDate: null,
            remainingSyncs: 0,
          },
        });
      }

      // Check and reset if needed
      userLimit.checkAndResetMonthlyCount();
      if (userLimit.isModified()) {
        await userLimit.save();
      }

      const remainingSyncs = Math.max(0, userLimit.monthlyLimit - userLimit.currentMonthCount);

      return NextResponse.json({
        limit: {
          userId: userLimit.userId?._id?.toString() || userLimit.userId,
          userName: userLimit.userId?.name || "Unknown",
          userEmail: userLimit.userId?.email || "Unknown",
          monthlyLimit: userLimit.monthlyLimit,
          currentMonthCount: userLimit.currentMonthCount,
          lastResetDate: userLimit.lastResetDate,
          remainingSyncs,
          createdAt: userLimit.createdAt,
          updatedAt: userLimit.updatedAt,
        },
      });
    }
  } catch (error: any) {
    console.error("Error fetching sync limits:", error);
    return NextResponse.json(
      { message: "Error fetching sync limits", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const tokenVerification: any = await verifyAdminToken(request);
  
  if (!tokenVerification.valid) {
    return NextResponse.json(
      { message: "Unauthorized: Invalid or missing JWT token" },
      { status: 401 }
    );
  }

  // Only superadmin can set limits
  if (tokenVerification.admin?.role !== "superadmin") {
    return NextResponse.json(
      { message: "Forbidden: Only owner can set sync limits" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, monthlyLimit } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    if (monthlyLimit === undefined || monthlyLimit === null) {
      return NextResponse.json(
        { message: "Monthly limit is required" },
        { status: 400 }
      );
    }

    if (typeof monthlyLimit !== "number" || monthlyLimit < 0) {
      return NextResponse.json(
        { message: "Monthly limit must be a non-negative number" },
        { status: 400 }
      );
    }

    // Verify user exists and is not superadmin
    const user = await AdminAuth.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.role === "superadmin") {
      return NextResponse.json(
        { message: "Cannot set limit for superadmin" },
        { status: 400 }
      );
    }

    // Create or update sync limit
    const userLimit = await UserSyncLimits.findOneAndUpdate(
      { userId },
      {
        monthlyLimit,
        updatedBy: tokenVerification.admin?._id,
        $setOnInsert: {
          currentMonthCount: 0,
          lastResetDate: new Date(),
          createdBy: tokenVerification.admin?._id,
        },
      },
      { upsert: true, new: true }
    )
      .populate("userId", "name email role")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    return NextResponse.json({
      message: "Sync limit updated successfully",
      limit: {
        userId: userLimit.userId?._id?.toString() || userLimit.userId,
        userName: userLimit.userId?.name || "Unknown",
        userEmail: userLimit.userId?.email || "Unknown",
        monthlyLimit: userLimit.monthlyLimit,
        currentMonthCount: userLimit.currentMonthCount,
        lastResetDate: userLimit.lastResetDate,
        createdAt: userLimit.createdAt,
        updatedAt: userLimit.updatedAt,
        createdBy: userLimit.createdBy?.name || "Unknown",
        updatedBy: userLimit.updatedBy?.name || "Unknown",
      },
    });
  } catch (error: any) {
    console.error("Error setting sync limit:", error);
    return NextResponse.json(
      { message: "Error setting sync limit", error: error.message },
      { status: 500 }
    );
  }
}

