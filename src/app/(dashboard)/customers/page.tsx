"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ApprovalRequests } from "@/components/ApprovalRequests";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { getApproveRequests } from "@/store/slices/approveRequests.slice";
import type { ApprovalRequest, ActivityLog } from "@/types/dashboard.types";

export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const [approvalRequests, setApprovalRequests] = useState([] as ApprovalRequest[]);
  const [activityLogs, setActivityLogs] = useState([] as ActivityLog[]);
  const previousPathname = useRef(null as string | null);

  const dashboardUser = user ? {
    name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
    role: user.role || '',
  } : { name: '', role: '' };

  const { requests, pagination, isLoading, error, lastFetchParams } = useAppSelector((state) => state.approveRequests);

  // Helper function to check if params match
  const paramsMatch = (params1: { page?: number; limit?: number } | null, params2: { page?: number; limit?: number }): boolean => {
    if (!params1) return false;
    return params1.page === params2.page && params1.limit === params2.limit;
  };

  // Fetch approve requests when navigating to this page
  useEffect(() => {
    // Check if we navigated to this page (pathname changed to /customers)
    const isNavigationToPage = previousPathname.current !== pathname && pathname === '/customers';
    
    if (isNavigationToPage) {
      previousPathname.current = pathname;
      
      // Check if we have cached data for the same params
      const fetchParams = { page: 1, limit: 25 };
      const hasCachedData = paramsMatch(lastFetchParams, fetchParams) && requests.length > 0;
      
      // If we have cached data, fetch in background; otherwise show loader
      const background = hasCachedData;
      dispatch(getApproveRequests({ ...fetchParams, background }));
    }
  }, [dispatch, pathname, lastFetchParams, requests.length]);

  return (
    <ApprovalRequests
      approvalRequests={approvalRequests}
      setApprovalRequests={setApprovalRequests}
      currentUser={dashboardUser}
      onApprove={(request) => {
        const newLog: ActivityLog = {
          id: Date.now().toString(),
          action: 'Customer Approved',
          details: `Approved customer registration for ${request.firstName} ${request.lastName} (${request.businessEmail})`,
          user: dashboardUser.name,
          role: dashboardUser.role,
          timestamp: new Date().toISOString()
        };
        setActivityLogs([newLog, ...activityLogs]);
      }}
    />
  );
}

