"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

/**
 * Custom hook to get user role from Redux state
 * Role is saved from login API response and persists after page refresh
 * 
 * @returns {string|null} User role: "admin" | "superadmin" | "customer" | null
 */
export function useRoleBasedDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isInitializing, token } = useAppSelector((state) => state.auth);

  // Redirect to login ONLY if loading is complete AND user is not authenticated
  // Wait for initialization from localStorage before redirecting
  useEffect(() => {
    // Don't redirect while still loading auth state
    if (isInitializing || isLoading) {
      return;
    }

    // Only redirect if definitely not authenticated (no user, no token, not authenticated)
    if (!isAuthenticated || !user || !token) {
      console.log("User not authenticated, redirecting to login");
      router.push("/");
    }
  }, [isAuthenticated, isLoading, isInitializing, user, token, router]);

  // Get user role from Redux state (saved from login API)
  const role = user?.role || null;

  return role;
}

