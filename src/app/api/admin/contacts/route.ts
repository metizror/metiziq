import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import Contacts from "@/models/contacts.model";
import { verifyAdminToken } from "../../../../services/jwt.service";
import { createActivity } from "../../../../services/activity.service";
import Country from "@/models/country.model";

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const tokenVerification = await verifyAdminToken(request);
  if (!tokenVerification.valid) {
    return NextResponse.json(
      { message: "Unauthorized: Invalid or missing JWT token" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const comapnyName = searchParams.get("companyName") || "";
    const employeeSize = searchParams.get("employeeSize") || "";
    const revenue = searchParams.get("revenue") || "";
    const industry = searchParams.get("industry") || "";
    const country = searchParams.get("country") || "";
    const state = searchParams.get("state") || "";
    const jobTitle = searchParams.get("jobTitle") || "";
    const jobLevel = searchParams.get("jobLevel") || "";
    const jobRole = searchParams.get("jobRole") || "";

    const pageNumber = Math.max(1, page);
    const limitNumber = Math.min(Math.max(1, limit), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const query: any = {};

    if (tokenVerification.admin?.role !== "superadmin") {
      query.uploaderId = tokenVerification.admin?._id;
    }

    const escapeRegex = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    if (employeeSize) {
      query.employeeSize = { $regex: escapeRegex(employeeSize), $options: "i" };
    }
    if (comapnyName) {
      query.companyName = { $regex: escapeRegex(comapnyName), $options: "i" };
    }
    if (revenue) {
      query.revenue = { $regex: escapeRegex(revenue), $options: "i" };
    }
    if (industry) {
      query["linkedInData.extractedProfileData.company_details.industry"] = { $regex: escapeRegex(industry), $options: "i" };
    }
    if (country) {
      query.country = { $regex: escapeRegex(country), $options: "i" };
    }
    if (state) {
      query.state = { $regex: escapeRegex(state), $options: "i" };
    }
    if (jobTitle) {
      query.jobTitle = { $regex: escapeRegex(jobTitle), $options: "i" };
    }
    if (jobLevel) {
      query.jobLevel = { $regex: escapeRegex(jobLevel), $options: "i" };
    }
    if (jobRole) {
      query.jobRole = { $regex: escapeRegex(jobRole), $options: "i" };
    }
    if (search) {
      const terms = search.trim().split(/\s+/);
      if (terms.length > 0) {
        query.$and = query.$and || [];
        terms.forEach((term) => {
          const escapedTerm = escapeRegex(term);
          query.$and.push({
            $or: [
              { firstName: { $regex: escapedTerm, $options: "i" } },
              { lastName: { $regex: escapedTerm, $options: "i" } },
              { fullName: { $regex: escapedTerm, $options: "i" } },
              { email: { $regex: escapedTerm, $options: "i" } },
              { companyName: { $regex: escapedTerm, $options: "i" } },
              { jobTitle: { $regex: escapedTerm, $options: "i" } },
              { "linkedInData.extractedProfileData.industry.value": { $regex: escapedTerm, $options: "i" } },
            ],
          });
        });
      }
    }

    const [contacts, totalCount] = await Promise.all([
      Contacts.find(query)
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 }),
      Contacts.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    return NextResponse.json({
      contacts,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error fetching contacts", error: error.message },
      { status: 500 }
    );
  }
}

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
    const { data } = body;

    let alreadyExists = await Contacts.findOne({ email: data.email });
    if (alreadyExists) {
      return NextResponse.json(
        { message: "Contact already exists" },
        { status: 400 }
      );
    }

    if (data.country === "Other") {
      await Country.create({ name: data.otherCountry, isActive: true });
    }

    const contact = await Contacts.create({
      ...data,
      fullName: `${data.firstName} ${data.lastName}`,
      createdBy: tokenVerification.admin?.name,
      uploaderId: tokenVerification.admin?._id,
    });

    await createActivity(
      "Contact created",
      `Contact ${data.firstName} ${data.lastName} created by ${tokenVerification.admin?.name}`,
      tokenVerification.admin?._id || "",
      tokenVerification.admin?.name || ""
    );

    return NextResponse.json(
      { message: "Contact created successfully", contact: contact },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error creating contact", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  await connectToDatabase();
  const tokenVerification = await verifyAdminToken(request);
  if (!tokenVerification.valid) {
    return NextResponse.json(
      { message: "Unauthorized: Invalid or missing JWT token" },
      { status: 401 }
    );
  }

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid input: 'ids' must be a non-empty array" },
        { status: 400 }
      );
    }

    await Contacts.deleteMany({ _id: { $in: ids } });

    await createActivity(
      "Contacts deleted",
      `${ids.length} Contacts deleted by ${tokenVerification.admin?.name}`,
      tokenVerification.admin?._id || "",
      tokenVerification.admin?.name || ""
    );

    return NextResponse.json(
      {
        message: "Contacts deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error deleting contacts", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { data } = body;
    const contact = await Contacts.findByIdAndUpdate(data.id, data, {
      new: true,
    });
    await createActivity(
      "Contact updated",
      `Contact ${data.firstName} ${data.lastName} updated by ${tokenVerification.admin?.name}`,
      tokenVerification.admin?._id || "",
      tokenVerification.admin?.name || ""
    );
    return NextResponse.json(
      { message: "Contact updated successfully", contact: contact },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error updating contact", error: error.message },
      { status: 500 }
    );
  }
}
