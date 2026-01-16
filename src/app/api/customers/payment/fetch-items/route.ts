import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectToDatabase } from "../../../../../lib/db";
import Contacts from "../../../../../models/contacts.model";
import Companies from "../../../../../models/companies.model";
import { requireCustomerAuth } from "../../../../../services/jwt.service";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireCustomerAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { type, itemIds } = body;

    if (!type || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { message: "Type and itemIds array are required" },
        { status: 400 }
      );
    }

    if (type !== "contacts" && type !== "companies") {
      return NextResponse.json(
        { message: "Type must be 'contacts' or 'companies'" },
        { status: 400 }
      );
    }

    // Validate all IDs are valid MongoDB ObjectIds
    const validIds = itemIds.filter((id: string) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length === 0) {
      return NextResponse.json(
        { message: "No valid item IDs provided" },
        { status: 400 }
      );
    }

    const objectIds = validIds.map((id: string) => new mongoose.Types.ObjectId(id));

    let items;
    if (type === "contacts") {
      items = await Contacts.find({ _id: { $in: objectIds } }).exec();
    } else {
      items = await Companies.find({ _id: { $in: objectIds } }).exec();
    }

    if (items.length === 0) {
      return NextResponse.json(
        { message: "No items found with the provided IDs" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      type,
      items,
      count: items.length,
    });
  } catch (err: any) {
    console.error("Error fetching items:", err);
    return NextResponse.json(
      { message: "Error fetching items", error: err.message },
      { status: 500 }
    );
  }
}

