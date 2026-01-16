import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectToDatabase } from "../../../../lib/db";
import { requireCustomerAuth } from "../../../../services/jwt.service";
import Companies from "../../../../models/companies.model";
import { extractCompanyNamesFromExcel, base64ToBuffer } from "../../../../lib/excel-company-filter";
import { sendMail } from "../../../../services/email.service";
import { getSuppressionListUploadedTemplate, getSuppressionListLimitReachedTemplate } from "../../../../templates/email";
import { startOfDay } from "date-fns";
import CustomerAuth from "../../../../models/customer_auth.model";
import Activity from "../../../../models/activity.model";

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireCustomerAuth(request);
  if (auth.error) return auth.error;
  const customer = auth.customer;
  try {
    const { searchParams } = new URL(request.url);
    const filterLimit = searchParams.get("limitFilter");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.min(Math.max(1, limit), 100);
    const skip = (pageNumber - 1) * limitNumber;
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "";
    const industry = searchParams.get("industry") || "";
    const revenue = searchParams.get("revenue") || "";
    const employeeSize = searchParams.get("employeeSize") || "";
    const excludeEmailsFile = searchParams.get("excludeEmailsFile") || "";

    const query: any = {};

    if (excludeEmailsFile) {
      try {
        const fileBuffer = base64ToBuffer(excludeEmailsFile);
        const excludedCompanyNames = extractCompanyNamesFromExcel(fileBuffer);

        if (excludedCompanyNames.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let dailyCount = customer?.dailyCompanySuppressionCount || 0;
          const lastDate = customer?.lastSuppressionDate ? new Date(customer.lastSuppressionDate) : null;

          if (lastDate) {
            lastDate.setHours(0, 0, 0, 0);
          }

          if (!lastDate || lastDate.getTime() !== today.getTime()) {
            dailyCount = 0;
          }
          if (dailyCount + excludedCompanyNames.length > 10000) {
            if (page === 1 && customer?.email) {
              try {
                await sendMail({
                  to: customer.email,
                  subject: "Suppression List Uploaded Limit reached",
                  html: getSuppressionListLimitReachedTemplate({ count: excludedCompanyNames.length }),
                });
              } catch (emailError) {
                console.error("Error sending suppression list limit email:", emailError);
              }
            }
          } else {
            if (page === 1) {
              if (customer?._id) {
                await CustomerAuth.findByIdAndUpdate(customer._id, {
                  dailyCompanySuppressionCount: dailyCount + excludedCompanyNames.length,
                  lastSuppressionDate: new Date()
                });

                // Log Activity
                try {
                  await Activity.create({
                    userId: customer._id,
                    user: `${customer.firstName} ${customer.lastName}`,
                    action: "Suppression list uploaded",
                    details: `${excludedCompanyNames.length} companies excluded`,
                  });
                } catch (logError) {
                  console.error("Error logging suppression list activity:", logError);
                }
              }
            }

            const companyNamePatterns = excludedCompanyNames.map((name: string) =>
              name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            );

            query.companyName = {
              $not: {
                $regex: new RegExp(`^(${companyNamePatterns.join('|')})$`, 'i')
              }
            };

            if (page === 1 && customer?.email) {
              try {
                await sendMail({
                  to: customer.email,
                  subject: "Suppression List Uploaded Successfully",
                  html: getSuppressionListUploadedTemplate({
                    name: `${customer.firstName} ${customer.lastName}`,
                    count: excludedCompanyNames.length,
                  }),
                });
              } catch (emailError) {
                console.error("Error sending suppression list email:", emailError);
              }
            }
          }
        }
      } catch (error: any) {
        console.error("Error processing exclude company names file:", error);
        return NextResponse.json(
          { message: `Error processing exclude company names file: ${error.message}` },
          { status: 400 }
        );
      }
    }
    if (search) {
      query.$or = [
        {
          firstName: { $regex: search, $options: "i" },
        },
        { lastName: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }
    if (country) {
      query.$or = [
        { country: { $regex: country, $options: "i" } },
        { otherCountry: { $regex: country, $options: "i" } },
      ];
    }
    if (industry) {
      query.industry = { $regex: industry, $options: "i" };
    }
    if (revenue) {
      query.revenue = { $regex: revenue, $options: "i" };
    }

    if (employeeSize) {
      query.employeeSize = { $regex: employeeSize, $options: "i" };
    }

    function maskValue(value: string | undefined | null): string {
      return value ? "x".repeat(value.length) : "xxxxxxxxxxxxxxxxxx";
    }

    const ableToBuyCompanies = customer?.ableToBuyCompanies === true;

    const finalLimit = filterLimit
      ? Math.min(Math.max(1, parseInt(filterLimit, 10)), 10000)
      : limitNumber;
    const finalSkip = filterLimit ? 0 : skip;

    const [companies, totalCount] = await Promise.all([
      Companies.find({ ...query })
        .skip(finalSkip)
        .limit(finalLimit)
        .sort({ createdAt: -1 })
        .exec(),
      Companies.countDocuments({ ...query }),
    ]);

    const transformedCompanies = companies.map((c) => {
      const resolvedCountry =
        c.country?.toLowerCase() === "other"
          ? c.otherCountry || ""
          : c.country || "";

      if (ableToBuyCompanies) {
        return {
          _id: c._id,
          companyName: c.companyName || "",
          phone: maskValue(c.phone),
          country: resolvedCountry,
          revenue: maskValue(c.revenue),
          employeeSize: maskValue(c.employeeSize),
          industry: maskValue(c.industry),
          technology: maskValue(c.technology),
          website: maskValue(c.website),
        };
      }

      return {
        _id: c._id,
        companyName: c.companyName || "",
        phone: maskValue(c.phone),
        country: resolvedCountry,
        revenue: maskValue(c.revenue),
        employeeSize: maskValue(c.employeeSize),
        industry: maskValue(c.industry),
        technology: maskValue(c.technology),
        website: maskValue(c.website),
      };
    });
    const responsePagination = filterLimit
      ? {
        currentPage: 1,
        totalPages: 1,
        totalCount: transformedCompanies.length,
        limit: finalLimit,
        hasNextPage: false,
        hasPreviousPage: false,
      }
      : {
        currentPage: pageNumber,
        totalPages: Math.max(1, Math.ceil(totalCount / finalLimit)),
        totalCount,
        limit: finalLimit,
        hasNextPage: pageNumber * finalLimit < totalCount,
        hasPreviousPage: pageNumber > 1,
      };

    return NextResponse.json(
      {
        companies: transformedCompanies,
        pagination: responsePagination,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error fetching companies", error: error.message },
      { status: 500 }
    );
  }
}
