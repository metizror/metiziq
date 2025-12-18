import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { requireCustomerAuth } from "../../../../../services/jwt.service";
import CustomerAuth from "@/models/customer_auth.model";
import bcryptjs from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { error, customer } = await requireCustomerAuth(request);
    if (error) return error;
    const { currentPassword, newPassword } = await request.json();

    const customerData = await CustomerAuth.findById(customer?._id as string);
    if (!customerData)
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    const hashedPassword = await bcryptjs.compare(currentPassword, customerData.password);

    if (!hashedPassword) {
      return NextResponse.json(
        { message: "current password is incorrect" },
        { status: 400 }
      );
    }
    customerData.password = await bcryptjs.hash(newPassword, 10);
    await customerData.save();
    return NextResponse.json({ message: "Password updated" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
