import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import Contacts from "../../../../models/contacts.model";
import { requireCustomerAuth } from "../../../../services/jwt.service";
import { extractEmailsFromExcel, base64ToBuffer } from "../../../../lib/excel-email-filter";
import { sendMail } from "../../../../services/email.service";
import { getSuppressionListUploadedTemplate, getSuppressionListLimitReachedTemplate } from "../../../../templates/email";
import CustomerAuth from "../../../../models/customer_auth.model";
import Activity from "../../../../models/activity.model";

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireCustomerAuth(request);
  if (auth.error) return auth.error;
  const customer = auth.customer;

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10)),
      100
    );
    const skip = (page - 1) * limit;

    const companyName = searchParams.get("companyName") || "";
    const jobTitle = searchParams.get("jobTitle") || "";
    const limitFilter = searchParams.get("limitFilter");
    const country = searchParams.get("country") || "";
    const search = searchParams.get("search") || "";
    const industry = searchParams.get("industry") || "";
    const jobLevel = searchParams.get("jobLevel") || "";
    const jobRole = searchParams.get("jobRole") || "";
    const employeeSize = searchParams.get("employeeSize") || "";
    const revenue = searchParams.get("revenue") || "";
    const excludeEmailsFile = searchParams.get("excludeEmailsFile") || "";
    const query: any = {};

    if (excludeEmailsFile) {
      try {
        const fileBuffer = base64ToBuffer(excludeEmailsFile);
        const excludedEmails = extractEmailsFromExcel(fileBuffer);

        if (excludedEmails.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let dailyCount = customer?.dailyContactSuppressionCount || 0;
          const lastDate = customer?.lastSuppressionDate ? new Date(customer.lastSuppressionDate) : null;

          if (lastDate) {
            lastDate.setHours(0, 0, 0, 0);
          }


          if (!lastDate || lastDate.getTime() !== today.getTime()) {
            dailyCount = 0;
          }


          if (dailyCount + excludedEmails.length > 10000) {

            if (page === 1 && customer?.email) {
              try {
                await sendMail({
                  to: customer.email,
                  subject: "Suppression List Uploaded Limit reached",
                  html: getSuppressionListLimitReachedTemplate({ count: excludedEmails.length }),
                });
              } catch (emailError) {
                console.error("Error sending suppression list limit email:", emailError);
              }
            }

          } else {

            if (page === 1) {
              if (customer?._id) {
                await CustomerAuth.findByIdAndUpdate(customer._id, {
                  dailyContactSuppressionCount: dailyCount + excludedEmails.length,
                  lastSuppressionDate: new Date()
                });

                // Log Activity
                try {
                  await Activity.create({
                    userId: customer._id,
                    user: `${customer.firstName} ${customer.lastName}`,
                    action: "Suppression list uploaded",
                    details: `${excludedEmails.length} contacts excluded`,
                  });
                } catch (logError) {
                  console.error("Error logging suppression list activity:", logError);
                }
              }
            }


            const emailPatterns = excludedEmails.map((email: string) =>
              email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            );


            query.email = {
              $not: {
                $regex: new RegExp(`^(${emailPatterns.join('|')})$`, 'i')
              }
            };


            if (page === 1 && customer?.email) {
              try {
                await sendMail({
                  to: customer.email,
                  subject: "Suppression List Uploaded Successfully",
                  html: getSuppressionListUploadedTemplate({
                    name: `${customer.firstName} ${customer.lastName}`,
                    count: excludedEmails.length,
                  }),
                });
              } catch (emailError) {
                console.error("Error sending suppression list email:", emailError);
              }
            }
          }
        }
      } catch (error: any) {
        console.error("Error processing exclude emails file:", error);
        return NextResponse.json(
          { message: `Error processing exclude emails file: ${error.message}` },
          { status: 400 }
        );
      }
    }

    if (companyName) query.companyName = { $regex: companyName, $options: "i" };
    if (jobTitle) query.jobTitle = { $regex: jobTitle, $options: "i" };
    if (country) query.country = { $regex: country, $options: "i" };
    if (industry) query.industry = { $regex: industry, $options: "i" };
    if (jobLevel) query.jobLevel = { $regex: jobLevel, $options: "i" };
    if (jobRole) query.jobRole = { $regex: jobRole, $options: "i" };
    if (employeeSize)
      query.employeeSize = { $regex: employeeSize, $options: "i" };
    if (revenue) query.revenue = { $regex: revenue, $options: "i" };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
      ];
    }

    const companySortRaw = parseInt(searchParams.get("companySort") || "0", 10);
    const jobTitleSortRaw = parseInt(
      searchParams.get("jobTitleSort") || "0",
      10
    );
    const createdAtSortRaw = parseInt(
      searchParams.get("createdAtSort") || "0",
      10
    );

    const isValidSort = (v: number) => v === 1 || v === -1;

    const sort: any = {};
    if (isValidSort(companySortRaw)) sort.companyName = companySortRaw;
    if (isValidSort(jobTitleSortRaw)) sort.jobTitle = jobTitleSortRaw;
    if (isValidSort(createdAtSortRaw)) sort.createdAt = createdAtSortRaw;

    if (Object.keys(sort).length === 0) {
      sort.createdAt = -1;
    } else {
      sort._id = 1;
    }

    function maskValue(value: string | undefined | null): string {
      return value ? "x".repeat(value.length) : "xxxxxxxxxxxxxxxxxx";
    }

    const ableToBuyContacts = customer?.ableToBuyContacts === true;

    const finalLimit = limitFilter
      ? Math.min(Math.max(1, parseInt(limitFilter, 10)), 10000)
      : ableToBuyContacts
        ? 10000
        : limit;
    const finalSkip = limitFilter ? 0 : ableToBuyContacts ? 0 : skip;

    const [contacts, totalCount] = await Promise.all([
      Contacts.find(query).sort(sort).skip(finalSkip).limit(finalLimit).exec(),
      Contacts.countDocuments(query),
    ]);

    const transformedContacts = contacts.map((c) => {
      return {
        _id: c._id,
        jobTitle: c.jobTitle || "",
        company: c.companyName || "",
        email: maskValue(c.email),
        phone: maskValue(c.phone),
        contact: `${maskValue(c.firstName)} ${maskValue(c.lastName)}`,
      };
    });

    const responsePagination = ableToBuyContacts
      ? {
        currentPage: 1,
        totalPages: 1,
        totalCount,
        limit: totalCount,
        hasNextPage: false,
        hasPreviousPage: false,
      }
      : limitFilter
        ? {
          currentPage: 1,
          totalPages: 1,
          totalCount: transformedContacts.length,
          limit: finalLimit,
          hasNextPage: false,
          hasPreviousPage: false,
        }
        : {
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(totalCount / finalLimit)),
          totalCount,
          limit: finalLimit,
          hasNextPage: page * finalLimit < totalCount,
          hasPreviousPage: page > 1,
        };

    return NextResponse.json({
      contacts: transformedContacts,
      pagination: responsePagination,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Error fetching contacts", error: err.message },
      { status: 500 }
    );
  }
}
