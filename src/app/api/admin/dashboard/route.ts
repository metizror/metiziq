import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "../../../../services/jwt.service";
import { connectToDatabase } from "../../../../lib/db";
import AdminAuth from "../../../../models/admin_auth.model";
import Contacts from "../../../../models/contacts.model";
import Companies from "../../../../models/companies.model";
import Activity from "@/models/activity.model";

// Route segment config for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const { error, admin } = await requireAdminAuth(request);
    if (error) {
      return error;
    }
    
    await connectToDatabase();
    
    // Fetch all dashboard data in parallel
    const [totalContacts, totalCompanies, totalUsers, lastImportContact, activityLogs] = await Promise.all([
      Contacts.countDocuments(),
      Companies.countDocuments(),
      AdminAuth.countDocuments({ role: "admin" }),
      Contacts.findOne().sort({ createdAt: -1 }).select("createdAt"),
      Activity.find().sort({ createdAt: -1 }).limit(5).lean()
    ]);

    // Format last import date
    const lastImportDate = lastImportContact?.createdAt 
      ? new Date(lastImportContact.createdAt).toISOString()
      : null;

    // Format activity logs
    const formattedActivityLogs = activityLogs.map((log: any) => ({
      id: log._id?.toString() || log.id,
      action: log.action,
      description: log.details || log.description || log.action,
      details: log.details || log.description || log.action,
      userId: log.userId?.toString() || log.userId,
      userName: log.user || log.userName || "Unknown",
      user: log.user || log.userName || "Unknown",
      createdBy: log.user || log.userName || "Unknown",
      timestamp: log.createdAt || log.timestamp,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    }));

    return NextResponse.json({
      totalContacts,
      totalCompanies,
      totalUsers,
      lastImportDate,
      activityLogs: formattedActivityLogs,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error.message 
      },
      { status: 500 }
    );
  }
}
