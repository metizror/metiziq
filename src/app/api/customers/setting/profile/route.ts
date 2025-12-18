import { NextRequest, NextResponse } from "next/server";
import { requireCustomerAuth } from "../../../../../services/jwt.service";
import CustomerAuth from "../../../../../models/customer_auth.model";
import { connectToDatabase } from "../../../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { error, customer } = await requireCustomerAuth(request);
    if (error) return error;

    const customerData = await CustomerAuth.findById(customer?._id as string).select("-password");
    if (!customerData)
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );

    return NextResponse.json({
      customer: {
        _id: customerData._id,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        companyName: customerData.companyName,
        isActive: customerData.isActive,
        isEmailVerified: customerData.isEmailVerified,
        ableToBuyContacts: (customerData as any).ableToBuyContacts || false,
        ableToBuyCompanies: (customerData as any).ableToBuyCompanies || false,
        billingAddress: (customerData as any).billingAddress || {
          streetAddress: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        createdAt: customerData.createdAt,
        updatedAt: customerData.updatedAt,
      },
    }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { error, customer } = await requireCustomerAuth(request);
    if (error) return error;
    const body = await request.json();
    const { firstName, lastName, companyName, billingAddress } = body;

    const customerData = await CustomerAuth.findById(customer?._id as string);
    if (!customerData)
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );

    // Only update fields that are provided (not undefined)
    if (firstName !== undefined) {
      customerData.firstName = firstName;
    }
    if (lastName !== undefined) {
      customerData.lastName = lastName;
    }
    if (companyName !== undefined) {
      customerData.companyName = companyName;
    }
    if (billingAddress !== undefined) {
      if (!customerData.billingAddress) {
        customerData.billingAddress = {};
      }
      if (billingAddress.streetAddress !== undefined) customerData.billingAddress.streetAddress = billingAddress.streetAddress;
      if (billingAddress.city !== undefined) customerData.billingAddress.city = billingAddress.city;
      if (billingAddress.state !== undefined) customerData.billingAddress.state = billingAddress.state;
      if (billingAddress.zipCode !== undefined) customerData.billingAddress.zipCode = billingAddress.zipCode;
      if (billingAddress.country !== undefined) customerData.billingAddress.country = billingAddress.country;
    }

    await customerData.save();
    return NextResponse.json({ message: "Profile updated" }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
