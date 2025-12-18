import { registerCustomer } from "@/controller/auth.controller";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        return await registerCustomer(request);
    } catch (error: any) {
        console.error("Register route error:", error);
        return new Response(
            JSON.stringify({
                status: 500,
                message: error.message || "Failed to register",
                customer: null,
            }),
            { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}
