import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "../../../../services/jwt.service";
import { connectToDatabase } from "../../../../lib/db";
import Contacts from "../../../../models/contacts.model";
import Activity from "../../../../models/activity.model";
import Companies from "../../../../models/companies.model";

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;
  try {
   const addedContacts = await Contacts.countDocuments({ uploaderId: auth.admin?._id });
   const addedCompanies = await Companies.countDocuments({ uploaderId: auth.admin?._id });
   const lastImportContact = await Contacts.findOne({ uploaderId: auth.admin?._id }).sort({ createdAt: -1 }).select("createdAt");
   const activityLogs = await Activity.find({ userId: auth.admin?._id }).sort({ createdAt: -1 }).limit(5).lean();
   return NextResponse.json({ addedContacts, addedCompanies, lastImportContact, activityLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}