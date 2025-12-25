import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import Contacts from "@/models/contacts.model";
import { verifyAdminToken } from "../../../../../services/jwt.service";
import { createActivity } from "../../../../../services/activity.service";
import axios from "axios";

// LinkedIn API endpoint
const LINKEDIN_API_URL = "https://n8n.metizsoft.in/webhook/emails-linkedin";

export async function POST(request: NextRequest) {
    await connectToDatabase();
    const tokenVerification = await verifyAdminToken(request);
    if (!tokenVerification.valid) {
        return NextResponse.json(
            { message: "Unauthorized: Invalid or missing JWT token" },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { emails } = body;

        if (!Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json(
                { message: "Invalid input: 'emails' must be a non-empty array" },
                { status: 400 }
            );
        }

        const results = [];
        const errors = [];

        // Process each email
        for (const email of emails) {
            try {
                // Find contact first to get details for the payload
                const contact = await Contacts.findOne({ email });

                if (!contact) {
                    errors.push({
                        email,
                        error: "Contact not found in database",
                    });
                    continue;
                }

                // Call LinkedIn API using axios
                const payload = {
                    first_name: contact.firstName || "",
                    last_name: contact.lastName || "",
                    city: contact.city || "",
                    position: contact.jobTitle || "",
                    company: contact.companyName || "",
                    email: contact.email,
                };

                // Call LinkedIn API using axios
                const linkedInResponse = await axios.post(LINKEDIN_API_URL, payload);

                console.log("linkedInResponse", linkedInResponse.data);

                // Extract the first response (API returns an array)
                const linkedInData = linkedInResponse.data;
                const responseData = linkedInData?.[0];

                if (!responseData || responseData.isEmailVerified === undefined) {
                    errors.push({
                        email,
                        error: "Invalid response from LinkedIn API",
                    });
                    continue;
                }

                // Update contact with isEmailVerified (always save this)
                const updateData: any = {
                    isEmailVerified: responseData.isEmailVerified,
                    syncDate: new Date(),
                };

                // Only add linkedInData if profile was found successfully
                if (responseData.success && responseData.data) {
                    updateData.linkedInData = responseData.data;
                }

                const updatedContact = await Contacts.findOneAndUpdate(
                    { email },
                    { $set: updateData },
                    { new: true }
                );

                // If profile was not found but email is verified, still mark as partial success
                if (!responseData.success) {
                    errors.push({
                        email,
                        error: responseData?.errorCode || responseData?.message || "LinkedIn profile not found, but email verified",
                    });
                }

                results.push({
                    email,
                    success: responseData.success,
                    contact: updatedContact,
                });

                // Log activity
                await createActivity(
                    responseData.success ? "LinkedIn data synced" : "Email verified",
                    responseData.success
                        ? `LinkedIn data synced for contact ${email} by ${tokenVerification.admin?.name}`
                        : `Email verified for contact ${email} by ${tokenVerification.admin?.name}`,
                    tokenVerification.admin?._id || "",
                    tokenVerification.admin?.name || ""
                );
            } catch (error: any) {
                errors.push({
                    email,
                    error: error.message || "Unknown error occurred",
                });
            }
        }

        // Return combined results
        return NextResponse.json(
            {
                message: `Processed ${emails.length} contacts`,
                results,
                errors,
                summary: {
                    total: emails.length,
                    successful: results.length,
                    failed: errors.length,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { message: "Error syncing LinkedIn data", error: error.message },
            { status: 500 }
        );
    }
}
