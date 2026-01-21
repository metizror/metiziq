import { NextRequest, NextResponse } from "next/server";
import Country from "../../../../models/country.model";
import { connectToDatabase } from "../../../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  await connectToDatabase();
  try {
    const countries = await Country.find({ isActive: true });
    return NextResponse.json(countries, { status: 200 });
    } catch (error: any) {
    return NextResponse.json(
      {
        status: 500,
        message: "Error fetching countries",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

