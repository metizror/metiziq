import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import Contacts from "@/models/contacts.model";
import companyModel from "@/models/companies.model";
import { verifyAdminToken } from "../../../../../services/jwt.service";
import { createActivity } from "../../../../../services/activity.service";
import axios from "axios";

// LinkedIn API endpoint
const LINKEDIN_API_URL = "https://n8n.metizsoft.in/webhook/emails-linkedin";

// Increase timeout for LinkedIn sync (5 minutes)
export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const tokenVerification: any = await verifyAdminToken(request);
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
        const contact: any = await Contacts.findOne({ email });

        if (!contact) {
          errors.push({
            email,
            error: "Contact not found in database",
          });
          continue;
        }

        // Check if sync was done within the last 24 hours
        if (contact.syncDate) {
          const lastSyncDate = new Date(contact.syncDate);
          const now = new Date();
          const timeDifference = now.getTime() - lastSyncDate.getTime();
          const oneDayInMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds

          if (timeDifference < oneDayInMs) {
            // Calculate hours until next sync is allowed
            const hoursUntilNextSync = Math.ceil(
              (oneDayInMs - timeDifference) / (60 * 60 * 1000)
            );
            const nextSyncDate = new Date(lastSyncDate.getTime() + oneDayInMs);

            results.push({
              email,
              success: false,
              message: `Please sync tomorrow. Last synced on ${lastSyncDate.toLocaleString()}. Next sync available after ${nextSyncDate.toLocaleString()}`,
              skipped: true,
            });
            continue;
          }
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
        if (responseData.data) {
          updateData.linkedInData = responseData.data;
        }

        const updatedContact = await Contacts.findOneAndUpdate(
          { email },
          { $set: updateData },
          { new: true }
        );

        // Get company name and website from LinkedIn data
        const companyName = updatedContact?.linkedInData?.extractedProfileData?.company_details?.company_name || "";
        const companyWebsite = updatedContact?.linkedInData?.extractedProfileData?.company_details?.website || "";
        
        // Check if company exists: first 10 chars of name match AND website matches
        let existCompany = null;
        if (companyName && companyName.length >= 10) {
          const first10Chars = companyName.substring(0, 10).trim();
          const queryConditions: any[] = [
            {
              companyName: {
                $regex: new RegExp(`^${first10Chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
              }
            }
          ];
          
          // Add website condition only if website is provided
          if (companyWebsite) {
            queryConditions.push({
              'allDetails.website': companyWebsite
            });
          }
          
          existCompany = await companyModel.findOne({
            $and: queryConditions
          });
        }
        if (!existCompany) {
            console.log("company not found creating company");
          await companyModel.create({
            companyName:
              updatedContact?.linkedInData?.extractedProfileData
                ?.company_details?.company_name || "",
            uploaderId: tokenVerification.admin?._id || "",
            createdBy: tokenVerification.admin?.name || "",
            allDetails:
              updatedContact?.linkedInData?.extractedProfileData
                ?.company_details || {},
          });
        } else {
          console.log("company found, updating company name and details");
          // Update company name and allDetails with the latest data from contact
          await companyModel.findByIdAndUpdate(
            existCompany._id,
            {
              $set: {
                companyName: companyName || existCompany.companyName,
                allDetails: updatedContact?.linkedInData?.extractedProfileData?.company_details || existCompany.allDetails
              }
            },
            { new: true }
          );
        }

        // If profile was not found but email is verified, still mark as partial success
        if (!responseData.success) {
          errors.push({
            email,
            error:
              responseData?.errorCode ||
              responseData?.message ||
              "LinkedIn profile not found, but email verified",
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
        console.log("error", error);
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
    console.log("error", error);
    return NextResponse.json(
      { message: "Error syncing LinkedIn data", error: error.message },
      { status: 500 }
    );
  }
}
