import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import { requireCustomerAuth } from "../../../../services/jwt.service";
import Activity from "../../../../models/activity.model";

export async function GET(request: NextRequest) {
    await connectToDatabase();
    const auth = await requireCustomerAuth(request);
    if (auth.error) return auth.error;

    try {
        const customer = auth.customer;
        if (!customer) {
            return NextResponse.json(
                { message: "Customer not found" },
                { status: 404 }
            );
        }

        const logs = await Activity.find({ userId: customer._id })
            .sort({ createdAt: -1 })
            .limit(20) // Limit to 20 recent activities
            .exec();

        return NextResponse.json({
            activities: logs.map(log => ({
                id: log._id,
                action: log.action,
                details: log.details,
                createdAt: log.createdAt,
            })),
        });
    } catch (err: any) {
        console.error("Error fetching activity logs:", err);
        return NextResponse.json(
            { message: "Error fetching activity logs", error: err.message },
            { status: 500 }
        );
    }
}
