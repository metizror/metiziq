import customerAuthModel from "../models/customer_auth.model";
import adminAuthModel from "../models/admin_auth.model";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type {
  LoginPayload,
  LoginSuccessResponse,
  LoginFailResponse,
} from "../types/auth.types";
import jwt from "jsonwebtoken";
import Otp from "../models/otp.model";
import { sendMail } from "../services/email.service";
import crypto from "crypto";

// Verify hCaptcha token
const verifyCaptcha = async (token: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY is not set");
      return { valid: false, error: "CAPTCHA secret key not configured" };
    }

    if (!token || token.trim() === '') {
      return { valid: false, error: "CAPTCHA token is empty" };
    }

    const response = await fetch(
      `https://hcaptcha.com/siteverify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
      }
    );

    if (!response.ok) {
      console.error("hCaptcha API request failed:", response.status, response.statusText);
      return { valid: false, error: `hCaptcha API request failed: ${response.statusText}` };
    }

    const data = await response.json();

    if (data.success === true) {
      return { valid: true };
    } else {
      // Log the error details from hCaptcha
      const errorMessages = data['error-codes'] || [];
      const errorMessage = errorMessages.length > 0
        ? `Invalid hCaptcha: ${errorMessages.join(', ')}`
        : "CAPTCHA verification failed";
      console.error("hCaptcha verification failed:", errorMessages, "Token:", token.substring(0, 20) + "...");
      return { valid: false, error: errorMessage };
    }
  } catch (error: any) {
    console.error("CAPTCHA verification error:", error);
    return { valid: false, error: error.message || "CAPTCHA verification error" };
  }
};

// sendOtp now saves OTP to DB with 5-min expiry
export const sendOtp = async (req: Request) => {
  try {
    const { email } = (await req.json()) as { email: string };
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email }); // Invalidate old OTP(s)
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    // TODO: Integrate production email provider here
    console.log(`Send OTP ${otp} to ${email}`);
    return NextResponse.json({ message: "OTP sent to email", otp });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to send OTP", error: error.message },
      { status: 500 }
    );
  }
};

export const verifyOtp = async (req: Request) => {
  try {
    const { email, otp } = (await req.json()) as { email: string; otp: string };
    const otpDoc = await Otp.findOne({ email, otp });
    if (otpDoc) {
      await customerAuthModel.updateOne(
        { email },
        { $set: { isEmailVerified: true } }
      );
      await Otp.deleteMany({ email }); // Remove OTP(s)
      return NextResponse.json({
        message: "OTP verified",
        isEmailVerified: true,
      });
    } else {
      return NextResponse.json(
        { message: "Invalid or expired OTP", isEmailVerified: false },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to verify OTP", error: error.message },
      { status: 500 }
    );
  }
};

export const registerCustomer = async (req: Request) => {
  try {
    const { firstName, lastName, email, companyName, password, captchaToken } =
      await req.json();

    // Verify CAPTCHA
    if (!captchaToken) {
      return NextResponse.json(
        { message: "CAPTCHA verification is required" },
        { status: 400 }
      );
    }

    const captchaResult = await verifyCaptcha(captchaToken);
    if (!captchaResult.valid) {
      return NextResponse.json(
        { message: captchaResult.error || "CAPTCHA verification failed. Please try again." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await adminAuthModel.findOne({ email });
    const customer = await customerAuthModel.findOne({ email });
    if (admin || customer) {
      return NextResponse.json(
        { message: "customer already exists with this email" },
        { status: 400 }
      );
    }

    // Generate secure verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Get base URL from environment variable or construct from request
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl && req.url) {
      try {
        const url = new URL(req.url);
        baseUrl = `${url.protocol}//${url.host}`;
      } catch {
        baseUrl = "http://localhost:3000";
      }
    }
    if (!baseUrl) {
      baseUrl = "http://localhost:3000";
    }
    const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    // Create customer with verification token
    const newCustomer = await customerAuthModel.create({
      firstName,
      lastName,
      email,
      companyName,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    });

    // Send verification email
    await sendMail({
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for registering with us. Please verify your email address by clicking the link below:</p>
          <p style="margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationLink}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
      text: `Hello ${firstName},\n\nThank you for registering. Please verify your email by clicking this link:\n${verificationLink}\n\nThis link will expire in 24 hours.`,
    });

    return NextResponse.json(
      {
        message:
          "Customer registered successfully. Please check your email to verify your account.",
        customer: {
          _id: newCustomer._id,
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          email: newCustomer.email,
          companyName: newCustomer.companyName,
          isEmailVerified: newCustomer.isEmailVerified,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to register customer:", error);
    return NextResponse.json(
      { message: "Failed to register customer", error: error.message },
      { status: 500 }
    );
  }
};

export const loginController = async (
  data: LoginPayload
): Promise<LoginSuccessResponse | LoginFailResponse> => {
  try {
    const { email, password } = data;
    const [customer, admin] = await Promise.all([
      customerAuthModel.findOne({ email }),
      adminAuthModel.findOne({ email }),
    ]);

    if (!customer && !admin) {
      return {
        status: 400,
        message: "Invalid email or password",
        customer: null,
        admin: null,
      } as LoginFailResponse;
    }

    if (customer) {
      // Check if customer is blocked
      if (customer.isBlocked) {
        return {
          status: 403,
          message: `You are blocked by admin, reason: ${customer.blockedReason}`,
          customer: null,
          admin: null,
        } as LoginFailResponse;
      }

      if (!customer.isEmailVerified) {
        return {
          status: 403,
          message: "Please verify your email to login. Check your email for the verification link.",
          customer: null,
          admin: null,
        } as LoginFailResponse;
      }

      const isPasswordValid = await bcrypt.compare(password, customer.password);
      if (isPasswordValid) {
        const token: string = jwt.sign(
          { id: customer._id.toString() },
          process.env.JWT_SECRET as string,
          { expiresIn: "1d" }
        );
        // Single login logic removed - no need to update currentToken
        // await customerAuthModel.updateOne(
        //   { _id: customer._id },
        //   { $set: { currentToken: token } }
        // );
        return {
          status: 200,
          message: "Login successfully",
          token: token,
          customer: customer,
        } as LoginSuccessResponse;
      }
    }

    if (admin) {
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (isPasswordValid) {
        const token: string = jwt.sign(
          { id: admin._id.toString() },
          process.env.JWT_SECRET as string,
          { expiresIn: "1d" }
        );
        // Single login logic removed - no need to update currentToken
        // await adminAuthModel.updateOne(
        //   { _id: admin._id },
        //   { $set: { currentToken: token } }
        // );
        return {
          status: 200,
          message: "Login successfully",
          token: token,
          admin: admin,
        } as LoginSuccessResponse;
      }
    }

    return {
      status: 400,
      message: "Invalid email or password",
      customer: null,
      admin: null,
    } as LoginFailResponse;
  } catch (error: any) {
    console.error("Login controller error:", error);
    return {
      status: 500,
      message: error.message || "Failed to login",
      customer: null,
      admin: null,
    } as LoginFailResponse;
  }
};
