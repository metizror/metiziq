"use client";

import React from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { useResetPassword } from "@/hooks/useResetPassword";
import { forgotPassword } from "@/store/slices/resetPassword.slice";
import * as yup from "yup";

const verifyOtpSchema = yup.object().shape({
  otp: yup
    .string()
    .required("OTP is required")
    .length(6, "OTP must be 6 digits")
    .matches(/^\d+$/, "OTP must contain only numbers"),
});

export default function VerifyOtpStep() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { email, role, isLoading } = useResetPassword();

  const initialValues = {
    otp: "",
  };

  const { handleChange, handleSubmit, values, errors, touched, setFieldValue } = useFormik({
    initialValues,
    validationSchema: verifyOtpSchema,
    onSubmit: async (value, action) => {
      if (!email || !role) {
        toast.error("Email or role not found. Please start over.");
        router.push("/reset-password");
        return;
      }

      try {
        await dispatch(
          forgotPassword({
            email,
            step: "verify-otp",
            otp: value.otp,
            role,
          })
        ).unwrap();

        toast.success("OTP verified successfully");
        action.resetForm();
      } catch (err: any) {
        toast.error(err.message || "Invalid OTP. Please try again.");
        setFieldValue("otp", "");
      }
    },
  });

  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setFieldValue("otp", numericValue);
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/reset-password")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="flex-1 text-center">Verify OTP</CardTitle>
          <div className="w-8" />
        </div>
        <p className="text-sm text-gray-600 text-center mt-2">
          Step 2 of 3: Enter the 6-digit code sent to {email || "your email"}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center w-full">
              <InputOTP
                maxLength={6}
                value={values.otp}
                onChange={handleOtpChange}
                disabled={isLoading}
                containerClassName="w-full justify-center"
                pattern={/^[0-9]*$/}
              >
                <InputOTPGroup className="gap-3">
                  <InputOTPSlot index={0} className="h-14 w-14 text-xl font-semibold cursor-text" />
                  <InputOTPSlot index={1} className="h-14 w-14 text-xl font-semibold cursor-text" />
                  <InputOTPSlot index={2} className="h-14 w-14 text-xl font-semibold cursor-text" />
                  <InputOTPSlot index={3} className="h-14 w-14 text-xl font-semibold cursor-text" />
                  <InputOTPSlot index={4} className="h-14 w-14 text-xl font-semibold cursor-text" />
                  <InputOTPSlot index={5} className="h-14 w-14 text-xl font-semibold cursor-text" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {errors.otp && touched.otp && (
              <p className="text-xs text-red-600 font-medium text-center">{errors.otp}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            style={{ backgroundColor: "#EF8037" }}
            disabled={isLoading || values.otp.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Verify OTP
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

