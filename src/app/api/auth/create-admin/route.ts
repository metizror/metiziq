import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import adminAuthModel from "@/models/admin_auth.model";
import bcrypt from "bcryptjs";
import { verifyAdminToken } from "../../../../services/jwt.service";
import customerAuthModel from "../../../../models/customer_auth.model";

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const { valid, admin, decoded } = await verifyAdminToken(request);
  try {
    if (admin?.role == "superadmin") {
      const { name, email, password, role } = await request.json();

      if (!name || !email || !password || !role) {
        return NextResponse.json(
          { message: "Name, email, password, and role are required" },
          { status: 400 }
        );
      }

      if (!["admin", "superadmin"].includes(role)) {
        return NextResponse.json(
          { message: "Role must be 'admin' or 'superadmin'" },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { message: "Password must be at least 8 characters long" },
          { status: 400 }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();

      const hashedPassword = await bcrypt.hash(password, 10);

      const existingAdmin = await adminAuthModel.findOne({
        email: normalizedEmail,
      });
      const existingCustomer = await customerAuthModel.findOne({
        email: normalizedEmail,
      });
      if (existingAdmin || existingCustomer) {
        return NextResponse.json({
          message: "Admin or customer already exists with this email",
        }, { status: 400 });
      }
        const newAdmin = await adminAuthModel.create({
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role,
        });

        return NextResponse.json(
          {
            message: "Admin account created successfully",
            admin: {
              email: newAdmin.email,
              name: newAdmin.name,
              role: newAdmin.role,
            },
          },
          { status: 201 }
        );
    } else {
      return NextResponse.json(
        { message: "You are not authorized to create an admin account" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      {
        message: "Failed to create/update admin account",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const { valid, admin, decoded } = await verifyAdminToken(request);
  if (!valid || admin?.role !== "superadmin") {
    return NextResponse.json(
      { message: "Unauthorized: Invalid or missing JWT token" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get("search");

    let query: any = {};
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query = {
        $or: [
          { name: { $regex: escapedSearch, $options: "i" } },
          { email: { $regex: escapedSearch, $options: "i" } },
        ],
      };
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;
    const totalAdmins = await adminAuthModel.countDocuments(query);
    const totalPages = Math.ceil(totalAdmins / limit);
    await connectToDatabase();
    const admins = await adminAuthModel
      .find({ ...query, role: "admin" })
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    return NextResponse.json(
      {
        admins,
        totalAdmins: admins.length,
        totalPages,
        pagination: {
          currentPage: page,
          totalPages,
          totalAdmins: admins.length,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Get admins error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  await connectToDatabase();
  const { valid, admin, decoded } = await verifyAdminToken(request);
  if (!valid || admin?.role !== "superadmin") {
    return NextResponse.json(
      { message: "Unauthorized: Invalid or missing JWT token" },
      { status: 401 }
    );
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { message: "Invalid input: 'id' is required" },
        { status: 400 }
      );
    }
    const admin = await adminAuthModel.findByIdAndDelete(id);
    if (!admin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Admin deleted successfully", admin },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  await connectToDatabase();
  const { valid, admin, decoded } = await verifyAdminToken(request);
  if (!valid || admin?.role !== "superadmin") {
    return NextResponse.json(
      { message: "Unauthorized: Invalid or missing JWT token" },
      { status: 401 }
    );
  }
  try {
    const { id, name, isActive } = await request.json();
    const admin = await adminAuthModel.findByIdAndUpdate(
      id,
      { name, isActive },
      { new: true }
    );
    return NextResponse.json(
      { message: "Admin updated successfully", admin },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
