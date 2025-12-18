"use client";

import { useAppSelector } from "@/store/hooks";

/**
 * Custom hook to get reset password state from Redux
 * @returns {Object} Reset password state including step, email, role, isLoading, error, success
 */
export function useResetPassword() {
  const resetPasswordState = useAppSelector((state) => state.resetPassword);

  return {
    step: resetPasswordState.step,
    email: resetPasswordState.email,
    role: resetPasswordState.role,
    isLoading: resetPasswordState.isLoading,
    error: resetPasswordState.error,
    success: resetPasswordState.success,
  };
}

