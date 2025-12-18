import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import { requireCustomerAuth } from "../../../../services/jwt.service";
import Support from "../../../../models/support.model";
import { createActivity } from "../../../../services/activity.service";
import { sendMail } from "../../../../services/email.service";
import { getSupportRequestReceivedTemplate } from "../../../../templates/email";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  try {
    const auth = await requireCustomerAuth(request);
    if (auth.error) return auth.error;
    const data = await request.json();

    await createActivity(
      "New support request created",
      `you have sent a new support request`,
      auth.customer?._id || "",
      `${auth.customer?.firstName} ${auth.customer?.lastName}` || ""
    );

    // Send confirmation email to customer
    if (auth.customer?.email) {
      await sendMail({
        to: auth.customer.email,
        subject: "Support Request Received",
        html: getSupportRequestReceivedTemplate({
          name: `${auth.customer.firstName} ${auth.customer.lastName}`,
        }),
      });
    }

    await Support.create(data);

    return NextResponse.json(
      { message: "Support request created successfully", success: true },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Error creating support",
        error: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}
