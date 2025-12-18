"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { ActivityLogsPanel } from "@/components/ActivityLogsPanel";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { getActivityLogs } from "@/store/slices/activityLogs.slice";

// Helper function to check if params match
const paramsMatch = (params1: { page?: number; limit?: number } | null, params2: { page?: number; limit?: number }): boolean => {
  if (!params1) return false;
  return params1.page === params2.page && params1.limit === params2.limit;
};

export default function ActivityPage() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { logs, pagination, isLoading, error, lastFetchParams, lastFetchTime } = useAppSelector((state) => state.activityLogs);
  const { user } = useAppSelector((state) => state.auth);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);

  // Memoize current params to avoid unnecessary re-renders
  const currentParams = useMemo(() => ({ page: currentPage, limit: currentLimit }), [currentPage, currentLimit]);

  const previousPathname = useRef(null as string | null);

  useEffect(() => {
    // Check if we navigated to this page (pathname changed to /activity)
    const isNavigationToPage = previousPathname.current !== pathname && pathname === '/activity';
    
    // Check if we have cached data for the same params
    const hasCachedData = paramsMatch(lastFetchParams, currentParams) && logs.length > 0;
    
    // Check if we need to fetch:
    // 1. No data exists AND we've never fetched before
    // 2. Params changed (page or limit)
    // 3. Navigating to this page - if we have cached data, refresh in background; otherwise show loader
    const shouldFetch = 
      (logs.length === 0 && lastFetchParams === null) || 
      !paramsMatch(lastFetchParams, currentParams) ||
      isNavigationToPage;

    if (shouldFetch) {
      // If we have cached data for same params, fetch in background
      // Otherwise, fetch normally (will show loader)
      const background = hasCachedData;
      dispatch(getActivityLogs({ ...currentParams, background }));
      if (isNavigationToPage) {
        previousPathname.current = pathname;
      }
    }
  }, [dispatch, currentPage, currentLimit, logs.length, lastFetchParams, currentParams, pathname]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setCurrentLimit(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  return (
    <div className="h-full w-full">
      <ActivityLogsPanel 
        logs={logs} 
        pagination={pagination}
        isLoading={isLoading} 
        error={error}
        userRole={user?.role || null}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        isFullScreen={true}
      />
    </div>
  );
}

