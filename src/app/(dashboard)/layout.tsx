"use client";

import { useEffect, useRef } from "react";
import { useRoleBasedDashboard } from "@/hooks/useRoleBasedDashboard";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout, updateUser, AuthState } from "@/store/slices/auth.slice";
import { useRouter, usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useState } from "react";
import type { User, Contact, Company, ActivityLog, ApprovalRequest } from "@/types/dashboard.types";
import type { UserObject } from "@/types/auth.types";
import { Button } from "@/components/ui/button";
import { LogOut, Filter } from "lucide-react";
import { FilterPanel } from "@/components/FilterPanel";
import { privateApiCall } from "@/lib/api";
import { PageTransition } from "@/components/PageTransition";
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = useRoleBasedDashboard();
  const { user, isLoading, isInitializing, isAuthenticated, token } = useAppSelector((state) => state.auth as AuthState);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const hasSyncedUserData = useRef(false);

  // State for dashboard data (can be replaced with API calls later)
  const [contacts] = useState([] as Contact[]);
  const [companies] = useState([] as Company[]);
  const [approvalRequests] = useState([] as ApprovalRequest[]);

  // Convert Redux user to User type
  const dashboardUser: User | null = user
    ? {
      id: user.id,
      email: user.email,
      name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
      role: user.role || null,
    }
    : null;

  // Convert User to UserObject for DashboardSidebar
  const sidebarUser: UserObject | null = dashboardUser
    ? {
      _id: dashboardUser.id,
      email: dashboardUser.email,
      name: dashboardUser.name,
      role: dashboardUser.role || "customer",
    }
    : null;

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

  // Fetch and sync user data from API on mount (only once)
  useEffect(() => {
    // Prevent duplicate calls - check ref first
    if (hasSyncedUserData.current || isInitializing || isLoading) {
      return;
    }

    // Only sync once when component mounts and auth is ready
    if (!isAuthenticated || !user || !token || (role !== "admin" && role !== "superadmin")) {
      return;
    }

    const syncUserData = async () => {
      try {
        hasSyncedUserData.current = true; // Set immediately to prevent duplicate calls
        const response = await privateApiCall<{ admin: any }>('/auth/me');
        if (response.admin) {
          // Only update if the data is different to prevent unnecessary updates
          const apiName = response.admin.name || '';
          const apiEmail = response.admin.email || '';

          if (user.name !== apiName || user.email !== apiEmail) {
            // Update Redux store with latest user data from API
            dispatch(updateUser({
              name: apiName,
              email: apiEmail
            }));
          }
        }
      } catch (error) {
        console.error('Failed to sync user data:', error);
        hasSyncedUserData.current = false; // Reset on error to allow retry
        // Don't show error toast here as it's a background sync
      }
    };

    syncUserData();
  }, [isInitializing, isLoading, isAuthenticated, user, token, role, dispatch]);

  // Redirect unauthenticated users to login and customers to their dashboard
  useEffect(() => {
    if (!isInitializing && !isLoading) {
      // Redirect if not authenticated
      if (!isAuthenticated || !user || !token) {
        router.push("/");
        return;
      }

      // Redirect customers to their customer dashboard
      if (role === "customer") {
        router.push("/customer/dashboard");
        return;
      }
    }
  }, [isInitializing, isLoading, isAuthenticated, user, token, role, router]);

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

  // Redirect if not authenticated
  if (!isAuthenticated || !user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Prevent customers from seeing admin dashboard - show redirecting state
  // This prevents the glitch where admin dashboard briefly appears before redirect
  if (role === "customer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to customer dashboard...</p>
        </div>
      </div>
    );
  }

  // Ensure dashboardUser exists, if not show error
  if (!dashboardUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Error loading user data. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  const pendingRequestsCount = approvalRequests.filter((req: ApprovalRequest) => req.status === 'pending').length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    { id: 'contacts', label: 'Contacts', icon: 'Users', path: '/contacts' },
    { id: 'companies', label: 'Companies', icon: 'Building2', path: '/companies' },
    // {
    //   id: 'customers',
    //   label: 'Customers',
    //   icon: 'CheckCircle2',
    //   path: '/customers',
    //   ...(pendingRequestsCount > 0 && { badge: pendingRequestsCount })
    // },
    ...(role === 'superadmin' ? [{ id: 'users', label: 'Users', icon: 'UserCheck', path: '/users' }] : []),
    { id: 'import', label: 'Import Data', icon: 'Upload', path: '/import' },
    { id: 'activity', label: 'Activity Logs', icon: 'Activity', path: '/activity' },
    { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' }
  ];

  // Get active view from pathname
  const getActiveView = () => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname.startsWith('/contacts')) return 'contacts';
    if (pathname.startsWith('/companies')) return 'companies';
    if (pathname.startsWith('/customers')) return 'customers';
    if (pathname.startsWith('/users')) return 'users';
    if (pathname.startsWith('/import')) return 'import';
    if (pathname.startsWith('/activity')) return 'activity';
    if (pathname.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const activeView = getActiveView();
  const showFilterButton = activeView === 'contacts' || activeView === 'companies';
  const pageTitle = pathname === '/dashboard'
    ? (role === 'superadmin' ? 'Owner Dashboard' : role === 'admin' ? 'Admin Dashboard' : 'Customer Dashboard')
    : activeView === 'customers'
      ? 'Customers'
      : activeView.charAt(0).toUpperCase() + activeView.slice(1).replace('-', ' ');

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        activeView={activeView}
        menuItems={menuItems}
        user={sidebarUser!}
        onLogout={handleLogout}
        pendingRequestsCount={pendingRequestsCount}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Hide header on contact and company detail pages */}
        {!pathname.startsWith('/contacts/') && !pathname.startsWith('/companies/') && (
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-semibold text-gray-900 capitalize">
                  {pageTitle}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {dashboardUser.name}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Filter Panel is handled within the page component */}

          {/* Remove padding on detail pages (any route with /[id] pattern like /contacts/123, /companies/456, etc.) */}
          {(() => {
            // Check if pathname has more than 2 segments (e.g., /contacts/123 or /companies/456)
            // Detail pages have pattern: /section/id or /section/id/subsection
            const pathSegments = pathname.split('/').filter(Boolean);
            // List of known list-only pages (not detail pages)
            const listOnlyPages = ['dashboard', 'settings', 'activity', 'import', 'customers'];
            // Pages that handle their own padding (like contacts page with filter panel)
            const selfPaddedPages = ['contacts'];
            // If we have at least 2 segments and the first segment is not a list-only page, it's likely a detail page
            const isDetailPage = pathSegments.length >= 2 && !listOnlyPages.includes(pathSegments[0]);
            // Exclude detail pages and self-padded pages from default padding
            const shouldAddPadding = !isDetailPage && !selfPaddedPages.includes(pathSegments[0]);

            return (
              <main className={`flex-1 overflow-hidden relative`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br rounded-full blur-3xl ${role === 'superadmin'
                    ? 'from-orange-200/30 via-orange-100/20 to-transparent'
                    : 'from-orange-200/30 via-orange-100/20 to-transparent'
                    }`}></div>
                  <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-200/20 via-purple-100/20 to-transparent rounded-full blur-3xl"></div>
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                  }}></div>
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent to-transparent ${role === 'superadmin' ? 'via-orange-400/30' : 'via-orange-400/30'
                    }`}></div>
                </div>

                <div className={`relative z-10 h-full min-h-0 overflow-y-auto ${shouldAddPadding ? 'dashboard-scroll-container' : ''}`} style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#2563EB #f1f1f1'
                }}>
                  <PageTransition>
                    {children}
                  </PageTransition>
                </div>
              </main>
            );
          })()}
        </div>
      </div>

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
    </div>
  );
}

