import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import AdminAuth from "../models/admin_auth.model";
import CustomerAuth from "../models/customer_auth.model";
import { connectToDatabase } from "../lib/db";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  ableToBuyContacts?: boolean;
  ableToBuyCompanies?: boolean;
  dailyContactSuppressionCount?: number;
  dailyCompanySuppressionCount?: number;
  lastSuppressionDate?: Date | null;
  billingAddress?: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminTokenVerificationResult {
  valid: boolean;
  admin?: AdminUser;
  decoded?: {
    adminId?: string;
    role: string;
    [key: string]: any;
  };
}

export interface CustomerTokenVerificationResult {
  valid: boolean;
  customer?: CustomerUser;
  decoded?: {
    customerId?: string;
    role: string;
    [key: string]: any;
  };
}

export const verifyAdminToken = async (
  request: NextRequest
): Promise<AdminTokenVerificationResult> => {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { valid: false };
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    if (!decoded.id) {
      return { valid: false };
    }
    await connectToDatabase();
    const admin = await AdminAuth.findById(decoded.id).select("-password");

    if (!admin) {
      return { valid: false };
    }

    if (admin.currentToken !== token) {
      return { valid: false };
    }

    const adminObject: AdminUser = {
      _id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role as "admin" | "superadmin",
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };

    return { valid: true, admin: adminObject, decoded };
  } catch (error) {
    return { valid: false };
  }
};

export const verifyCustomerToken = async (
  request: NextRequest
): Promise<CustomerTokenVerificationResult> => {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { valid: false };
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (!decoded.id) {
      return { valid: false };
    }

    await connectToDatabase();
    const customer = await CustomerAuth.findById(decoded.id).select(
      "-password"
    );

    if (!customer) {
      return { valid: false };
    }

    if (customer.currentToken !== token) {
      return { valid: false };
    }

    const customerObject: CustomerUser = {
      _id: customer._id.toString(),
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      companyName: customer.companyName,
      isActive: customer.isActive,
      isEmailVerified: customer.isEmailVerified,
      ableToBuyContacts: (customer as any).ableToBuyContacts,
      ableToBuyCompanies: (customer as any).ableToBuyCompanies,
      dailyContactSuppressionCount: (customer as any).dailyContactSuppressionCount,
      dailyCompanySuppressionCount: (customer as any).dailyCompanySuppressionCount,
      lastSuppressionDate: (customer as any).lastSuppressionDate,
      billingAddress: (customer as any).billingAddress,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };

    return { valid: true, customer: customerObject, decoded };
  } catch (error) {
    return { valid: false };
  }
};

export const requireAdminAuth = async (
  request: NextRequest
): Promise<{ error: NextResponse | null; admin: AdminUser | null }> => {
  const tokenVerification = await verifyAdminToken(request);
  if (!tokenVerification.valid) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      admin: null,
    };
  }
  return { error: null, admin: tokenVerification.admin || null };
};

export const requireCustomerAuth = async (
  request: NextRequest
): Promise<{ error: NextResponse | null; customer: CustomerUser | null }> => {
  const tokenVerification = await verifyCustomerToken(request);
  if (!tokenVerification.valid) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      customer: null,
    };
  }
  return { error: null, customer: tokenVerification.customer || null };
};
