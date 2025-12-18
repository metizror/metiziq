"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import CustomerSidebar from "@/components/CustomerSidebar";
import { SupportContactForm } from "@/components/SupportContactForm";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/auth.slice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, isLoading, isInitializing, isAuthenticated, token } = useAppSelector((state) => state.auth);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Redirect if not authenticated or not a customer
  useEffect(() => {
    if (!isInitializing && !isLoading) {
      if (!isAuthenticated || !user || !token) {
        router.push("/");
        return;
      }
      if (user.role !== "customer") {
        // If not a customer, redirect to appropriate dashboard
        if (user.role === "admin" || user.role === "superadmin") {
          router.push("/dashboard");
        } else {
          router.push("/");
        }
        return;
      }
    }
  }, [isInitializing, isLoading, isAuthenticated, user, token, router]);

  // Handle logout - show confirmation dialog
  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  // Confirm logout - clear both localStorage and sessionStorage
  const confirmLogout = () => {
    setShowLogoutDialog(false);
    // Clear all storage
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    // Dispatch logout action
    dispatch(logout());
    // Navigate to root login page
    router.push("/");
  };

  // Get user data from Redux
  const userName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Customer';
  const userEmail = user?.email || '';

  // Show loading state
  if (isInitializing || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not customer
  if (!isAuthenticated || !user || !token || user.role !== "customer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <CustomerSidebar
          pathname={pathname}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onSupportClick={() => setShowSupportModal(true)}
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>

      {/* Support Modal */}
      <SupportContactForm
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        userEmail={userEmail}
        userName={userName}
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

