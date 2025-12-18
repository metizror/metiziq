import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "../../../../services/jwt.service";
import CustomerAuth from "../../../../models/customer_auth.model";
import { connectToDatabase } from "../../../../lib/db";
import { createActivity } from "../../../../services/activity.service";
import { sendMail } from "../../../../services/email.service";
import { getAccountSuspendedTemplate } from "../../../../templates/email";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  try {
    const auth = await requireAdminAuth(request);
    if (auth.error) return auth.error;
    const { customerId, flag, blockedReason } = await request.json();

    if (flag === true) {
      const customer = await CustomerAuth.findById(customerId);
      if (!customer)
        return NextResponse.json(
          { message: "Customer not found" },
          { status: 404 }
        );
      customer.isBlocked = false;
      customer.blockedBy = null as any;
      customer.blockedReason = null as any;

      await customer.save();
      await createActivity(
        "Customer unblocked",
        `Customer ${customer?.firstName} ${customer?.lastName} unblocked by ${auth.admin?.name}`,
        auth.admin?._id || "",
        auth.admin?.name || ""
      );
    } else if (flag === false) {
      const customer = await CustomerAuth.findById(customerId);
      if (!customer)
        return NextResponse.json(
          { message: "Customer not found" },
          { status: 404 }
        );
      customer.isBlocked = true;
      customer.blockedBy = auth.admin?.name as any;
      customer.blockedReason = blockedReason;
      await customer.save();
      
      // Send account suspended email notification
      try {
        const suspendedEmailHtml = getAccountSuspendedTemplate({
          customerName: customer.firstName || customer.email.split('@')[0],
        });

        await sendMail({
          to: customer.email,
          subject: "Account Temporarily Suspended",
          html: suspendedEmailHtml,
        }).catch((err) => {
          console.error("Error sending account suspended email:", err);
        });
      } catch (error: any) {
        console.error("Error sending account suspended notification:", error);
      }
      
      await createActivity(
        "Customer blocked",
        `Customer ${customer?.firstName} ${customer?.lastName} blocked by ${auth.admin?.name}`,
        auth.admin?._id || "",
        auth.admin?.name || ""
      );
    }
    return NextResponse.json(
      { message: "Customer request updated" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  await connectToDatabase();
  try {
    const auth = await requireAdminAuth(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const allCustomers = await CustomerAuth.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const blockedCustomers = await CustomerAuth.find({
      isBlocked: true,
    }).countDocuments();

    const totalUsers = await CustomerAuth.countDocuments();

    return NextResponse.json(
      {
        allCustomers,
        blockedCustomers,
        totalUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(blockedCustomers / limit),
          totalBlockedCustomers: blockedCustomers,
          limit,
          hasNextPage: page < Math.ceil(blockedCustomers / limit),
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
