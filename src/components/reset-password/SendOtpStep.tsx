"use client";

import React from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { useResetPassword } from "@/hooks/useResetPassword";
import { forgotPassword, setEmail } from "@/store/slices/resetPassword.slice";
import * as yup from "yup";

const sendOtpSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .trim(),
});

export default function SendOtpStep() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { role, isLoading } = useResetPassword();

  const initialValues = {
    email: "",
  };

  const { handleChange, handleSubmit, values, errors, touched } = useFormik({
    initialValues,
    validationSchema: sendOtpSchema,
    onSubmit: async (value, action) => {
      try {
        // Set email in Redux state
        dispatch(setEmail(value.email));

        // Call API to send OTP - role will be determined by the API
        await dispatch(
          forgotPassword({
            email: value.email,
            step: "send-otp",
            // Role is optional - API will determine it from the email
            role: role || undefined,
          })
        ).unwrap();

        toast.success("OTP sent to your email");
        action.resetForm();
      } catch (err: any) {
        toast.error(err.message || "Failed to send OTP. Please try again.");
      }
    },
  });

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="flex-1 text-center">Forgot Password</CardTitle>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
        <p className="text-sm text-gray-600 text-center mt-2">
          Step 1 of 3: Enter your email to receive OTP
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={values.email}
                onChange={handleChange}
                className={`h-11 pl-10 ${errors.email && touched.email ? "border-red-500" : ""}`}
              />
            </div>
            {errors.email && touched.email && (
              <p className="text-xs text-red-600 font-medium">{errors.email}</p>
            )}
          </div>

          {role && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <span className="font-medium">Role:</span> {role.charAt(0).toUpperCase() + role.slice(1)}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11"
            style={{ backgroundColor: "#EF8037" }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

