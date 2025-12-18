"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { UsersTable } from "@/components/UsersTable";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { getAdminUsers } from "@/store/slices/adminUsers.slice";
import type { User } from "@/types/dashboard.types";

// Helper function to check if params match
const paramsMatch = (params1: { page?: number; limit?: number } | null, params2: { page?: number; limit?: number }): boolean => {
  if (!params1) return false;
  return params1.page === params2.page && params1.limit === params2.limit;
};

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const [users, setUsers] = useState([] as User[]);
  const previousPathname = useRef(null as string | null);

  const { users: adminUsers, pagination, isLoading, error, lastFetchParams } = useAppSelector((state) => state.adminUsers);

  // Fetch users when navigating to this page
  useEffect(() => {
    // Check if we navigated to this page (pathname changed to /users)
    const isNavigationToPage = previousPathname.current !== pathname && pathname === '/users';
    
    if (isNavigationToPage) {
      previousPathname.current = pathname;
      
      // Check if we have cached data for the same params
      const fetchParams = { page: 1, limit: 25 };
      const hasCachedData = paramsMatch(lastFetchParams, fetchParams) && adminUsers.length > 0;
      
      // If we have cached data, fetch in background; otherwise show loader
      const background = hasCachedData;
      dispatch(getAdminUsers({ ...fetchParams, background }));
    }
  }, [dispatch, pathname, lastFetchParams, adminUsers.length]);

  return <UsersTable users={users} setUsers={setUsers} />;
}

