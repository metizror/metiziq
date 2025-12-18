import { NextRequest, NextResponse } from "next/server";
import Companies from "../../../../models/companies.model";
import { connectToDatabase } from "../../../../lib/db";
import { requireAdminAuth } from "../../../../services/jwt.service";
import { createActivity } from "../../../../services/activity.service";
import Country from "../../../../models/country.model";


export async function GET(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const companyName = searchParams.get("companyName") || "";
    const industry = searchParams.get("industry") || "";
    const country = searchParams.get("country") || "";
    const state = searchParams.get("state") || "";
    const revenue = searchParams.get("revenue") || "";
    const employeeSize = searchParams.get("employeeSize") || "";
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.min(Math.max(1, limit), 100);
    const skip = (pageNumber - 1) * limitNumber;

    // Fast path: fetch by id when provided to avoid pagination loops
    if (id) {
      const company = await Companies.findById(id);
      if (!company) {
        return NextResponse.json(
          { message: "Company not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          company,
        },
        { status: 200 }
      );
    }

    const query: any = {};

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { industry: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { revenue: { $regex: search, $options: "i" } },
        { employeeSize: { $regex: search, $options: "i" } },
      ];
    }

    if (companyName) {
      query.companyName = { $regex: companyName, $options: "i" };
    }
    if (industry) {
      query.industry = { $regex: industry, $options: "i" };
    }
    if (country) {
      query.country = { $regex: country, $options: "i" };
    }
    if (state) {
      query.state = { $regex: state, $options: "i" };
    }
    if (revenue) {
      query.revenue = { $regex: revenue, $options: "i" };
    }
    if (employeeSize) {
      query.employeeSize = { $regex: employeeSize, $options: "i" };
    }
    const [companies, totalCount] = await Promise.all([
      Companies.find(query)
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 }),
      Companies.countDocuments(query),
    ]);
    const totalPages = Math.ceil(totalCount / limitNumber);
    return NextResponse.json(
      {
        companies,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalCount,
          limit: limitNumber,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1,
        },
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

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  let role;
  if (auth.admin?.role === "superadmin") {
    role = "Super Admin";
  } else {
    role = "Admin";
  }
  try {
    const body = await request.json();
    const { data } = body;


    if (data.country === "Other") {
     await Country.create({ name: data.otherCountry });
    }

    const company = await Companies.create(
      { ...data, createdBy: `${auth.admin?.name} (${role})`, uploaderId: auth.admin?._id },
    );
    if (auth.admin) {
      await createActivity(
        "Company created",
        `Company ${data.companyName || "Unknown"} created by ${
          auth.admin.name
        }`,
        auth.admin._id,
        auth.admin.name
      );
    }
    return NextResponse.json(
      { message: "Company created successfully", company: company },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error creating company", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { data } = body;
    const company = await Companies.findByIdAndUpdate(data.id, data, {
      new: true,
    });
    if (auth.admin) {
      await createActivity(
        "Company updated",
        `Company ${company.companyName || "Unknown"} updated by ${
          auth.admin.name
        }`,
        auth.admin._id,
        auth.admin.name
      );
    }
    return NextResponse.json(
      { message: "Company updated successfully", company: company },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error updating company", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  await connectToDatabase();
  const auth = await requireAdminAuth(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid input: 'ids' must be a non-empty array" },
        { status: 400 }
      );
    }
    const companies = await Companies.deleteMany({ _id: { $in: ids } });
    if (auth.admin) {
      await createActivity(
        "Companies deleted",
        `${ids.length} Companies deleted by ${auth.admin.name}`,
        auth.admin._id,
        auth.admin.name
      );
    }
    return NextResponse.json(
      { message: "Companies deleted successfully", companies: companies },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error deleting companies", error: error.message },
      { status: 500 }
    );
  }
}
