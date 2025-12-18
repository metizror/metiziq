"use client";

import React, { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { useResetPassword } from "@/hooks/useResetPassword";
import { forgotPassword, resetResetPasswordState } from "@/store/slices/resetPassword.slice";
import * as yup from "yup";

const resetPasswordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("newPassword")], "Passwords must match"),
});

export default function ResetPasswordStep() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { email, role, isLoading } = useResetPassword();
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  const initialValues = {
    newPassword: "",
    confirmPassword: "",
  };

  const { handleChange, handleSubmit, values, errors, touched } = useFormik({
    initialValues,
    validationSchema: resetPasswordSchema,
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
            step: "reset-password",
            newPassword: value.newPassword,
            role,
          })
        ).unwrap();

        toast.success("Password reset successfully!");
        setIsPasswordReset(true);
        action.resetForm();
        
        // Reset state and redirect to login after 3 seconds
        setTimeout(() => {
          dispatch(resetResetPasswordState());
          router.push("/");
        }, 3000);
      } catch (err: any) {
        toast.error(err.message || "Failed to reset password. Please try again.");
      }
    },
  });

  // Show success screen after password reset
  if (isPasswordReset) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-gradient-to-br from-green-500 to-emerald-500">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. Redirecting to login...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          <CardTitle className="flex-1 text-center">Reset Password</CardTitle>
          <div className="w-8" />
        </div>
        <p className="text-sm text-gray-600 text-center mt-2">
          Step 3 of 3: Enter your new password
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password *</Label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              placeholder="Enter new password"
              value={values.newPassword}
              onChange={handleChange}
              leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
              className={`h-11 ${errors.newPassword && touched.newPassword ? "border-red-500" : ""}`}
            />
            {errors.newPassword && touched.newPassword && (
              <p className="text-xs text-red-600 font-medium">{errors.newPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter new password"
              value={values.confirmPassword}
              onChange={handleChange}
              leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
              className={`h-11 ${errors.confirmPassword && touched.confirmPassword ? "border-red-500" : ""}`}
            />
            {errors.confirmPassword && touched.confirmPassword && (
              <p className="text-xs text-red-600 font-medium">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            style={{ backgroundColor: "#EF8037" }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

