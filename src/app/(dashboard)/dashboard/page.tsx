"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { DashboardStats } from "@/components/DashboardStats";
import { ImportDataModule } from "@/components/ImportDataModule";
import { ActivityLogsPanel } from "@/components/ActivityLogsPanel";
import { useAppSelector } from "@/store/hooks";
import { privateApiCall } from "@/lib/api";
import type { Contact, Company, ActivityLog } from "@/types/dashboard.types";

interface DashboardData {
  totalContacts: number;
  totalCompanies: number;
  totalUsers?: number; // Optional, not returned by admin-dashboard
  lastImportDate: string | null;
  activityLogs: ActivityLog[];
}

interface AdminDashboardData {
  addedContacts: number;
  addedCompanies: number;
  lastImportContact: {
    createdAt?: string;
  } | null;
  activityLogs: any[];
}

interface DashboardCache {
  contactsCount: number;
  companiesCount: number;
  adminUsersCount: number;
  lastImportDate: string | null;
  activityLogs: ActivityLog[];
  timestamp: number;
}

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const pathname = usePathname();

  const role = user?.role || null;
  const hasFetchedDashboard = useRef(false);
  const isFetching = useRef(false);
  const dashboardDataCache = useRef(null as DashboardCache | null);
  const previousPathname = useRef(null as string | null);

  // Cache duration: 5 minutes (300000 ms)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Initialize cache from sessionStorage if available (persists across remounts)
  const initializeCache = () => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("dashboardCache");
        if (cached) {
          const parsedCache = JSON.parse(cached) as DashboardCache;
          const now = Date.now();
          const cacheValid = (now - parsedCache.timestamp) < CACHE_DURATION;
          if (cacheValid) {
            dashboardDataCache.current = parsedCache;
            hasFetchedDashboard.current = true;
          } else {
            // Cache expired, clear it
            sessionStorage.removeItem("dashboardCache");
          }
        }
      } catch (error) {
        console.error("Error loading dashboard cache:", error);
        sessionStorage.removeItem("dashboardCache");
      }
    }
  };

  // Initialize cache on mount
  initializeCache();

  // Initialize state from cache if available (to prevent loader flash)
  const initializeFromCache = () => {
    if (dashboardDataCache.current) {
      const now = Date.now();
      const cacheValid = (now - dashboardDataCache.current.timestamp) < CACHE_DURATION;
      if (cacheValid) {
        return {
          contactsCount: dashboardDataCache.current.contactsCount,
          companiesCount: dashboardDataCache.current.companiesCount,
          adminUsersCount: dashboardDataCache.current.adminUsersCount,
          lastImportDate: dashboardDataCache.current.lastImportDate,
          activityLogs: dashboardDataCache.current.activityLogs,
          isLoading: false, // Don't show loader if we have cached data
        };
      }
    }
    // No cache or cache expired
    return {
      contactsCount: 0,
      companiesCount: 0,
      adminUsersCount: 0,
      lastImportDate: null,
      activityLogs: [],
      isLoading: true, // Show loader only if no cached data
    };
  };

  const initialCacheState = initializeFromCache();
  
  const [contactsCount, setContactsCount] = useState(initialCacheState.contactsCount);
  const [companiesCount, setCompaniesCount] = useState(initialCacheState.companiesCount);
  const [adminUsersCount, setAdminUsersCount] = useState(initialCacheState.adminUsersCount);
  const [lastImportDate, setLastImportDate] = useState(initialCacheState.lastImportDate);
  const [activityLogs, setActivityLogs] = useState(initialCacheState.activityLogs);
  
  // Single loading state for all dashboard data - initialize from cache
  const [isLoading, setIsLoading] = useState(initialCacheState.isLoading);
  // Background refresh indicator (separate from loading)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all dashboard data from single API endpoint on mount or navigation
  useEffect(() => {
    // Early return if no role or if customer (should be redirected by layout)
    if (!role || (role !== "admin" && role !== "superadmin")) {
      setIsLoading(false);
      return;
    }

    // Check if we navigated to this page (pathname changed to /dashboard)
    const isNavigationToPage = previousPathname.current !== pathname && pathname === '/dashboard';

    // Check if cached data exists and is still valid
    const now = Date.now();
    const cacheValid = dashboardDataCache.current && 
                      (now - dashboardDataCache.current.timestamp) < CACHE_DURATION;
    const hasCachedData = dashboardDataCache.current !== null;

    // If navigating to page
    if (isNavigationToPage) {
      previousPathname.current = pathname;
      
      // If we have cached data, show it immediately and fetch in background
      if (hasCachedData && dashboardDataCache.current) {
        // Show cached data immediately
        setContactsCount(dashboardDataCache.current.contactsCount);
        setCompaniesCount(dashboardDataCache.current.companiesCount);
        setAdminUsersCount(dashboardDataCache.current.adminUsersCount);
        setLastImportDate(dashboardDataCache.current.lastImportDate);
        setActivityLogs(dashboardDataCache.current.activityLogs);
        setIsLoading(false); // Don't show loader, we have cached data
        
        // Fetch fresh data in background
        if (!isFetching.current) {
          isFetching.current = true;
          setIsRefreshing(true);
          // Continue to fetch logic below...
        } else {
          return; // Already fetching in background
        }
      } else {
        // No cached data, show loader and fetch normally
        hasFetchedDashboard.current = false;
        isFetching.current = true;
        setIsLoading(true);
      }
    } else {
      // Not navigating, use cached data if valid
      if (cacheValid && hasFetchedDashboard.current) {
        setContactsCount(dashboardDataCache.current.contactsCount);
        setCompaniesCount(dashboardDataCache.current.companiesCount);
        setAdminUsersCount(dashboardDataCache.current.adminUsersCount);
        setLastImportDate(dashboardDataCache.current.lastImportDate);
        setActivityLogs(dashboardDataCache.current.activityLogs);
        setIsLoading(false);
        return;
      }

      // Prevent duplicate calls if already fetching
      if (isFetching.current) {
        if (!isLoading && !hasCachedData) {
          setIsLoading(true);
        }
        return;
      }
      
      if (hasFetchedDashboard.current && cacheValid) {
        return;
      }
      
      // Need to fetch
      isFetching.current = true;
      setIsLoading(true);
    }
    
    // Store whether we had cached data before fetch (for error handling)
    const hadCachedDataBeforeFetch = dashboardDataCache.current !== null;
    
    // Use different endpoints based on role
    const apiEndpoint = role === "admin" ? "/admin/admin-dashboard" : "/admin/dashboard";
    
    if (role === "admin") {
      // Call admin-dashboard API and map response
      privateApiCall<AdminDashboardData>(apiEndpoint)
          .then((response) => {
            const data = {
              contactsCount: response.addedContacts || 0,
              companiesCount: response.addedCompanies || 0,
              adminUsersCount: 0,
              lastImportDate: response.lastImportContact?.createdAt 
                ? new Date(response.lastImportContact.createdAt).toISOString()
                : null,
              activityLogs: (response.activityLogs || []).map((log: any) => ({
                id: log._id?.toString() || log.id,
                action: log.action,
                description: log.details || log.description || log.action,
                details: log.details || log.description || log.action,
                userId: log.userId?.toString() || log.userId,
                userName: log.user || log.userName || "Unknown",
                user: log.user || log.userName || "Unknown",
                createdBy: log.user || log.userName || "Unknown",
                timestamp: log.createdAt || log.timestamp,
                createdAt: log.createdAt,
                updatedAt: log.updatedAt,
              })),
              timestamp: now,
            };
            
            // Update all state and cache
            dashboardDataCache.current = data;
            // Persist cache to sessionStorage
            if (typeof window !== "undefined") {
              try {
                sessionStorage.setItem("dashboardCache", JSON.stringify(data));
              } catch (error) {
                console.error("Error saving dashboard cache:", error);
              }
            }
            setContactsCount(data.contactsCount);
            setCompaniesCount(data.companiesCount);
            setAdminUsersCount(data.adminUsersCount);
            setLastImportDate(data.lastImportDate);
            setActivityLogs(data.activityLogs);
            setIsLoading(false);
            setIsRefreshing(false);
            isFetching.current = false;
            hasFetchedDashboard.current = true; // Mark as fetched only after successful API call
          })
          .catch((error) => {
            console.error("Failed to fetch admin dashboard data:", error);
            setIsLoading(false);
            setIsRefreshing(false);
            isFetching.current = false;
            // Only clear cache if this was an initial load (not a background refresh)
            if (!hadCachedDataBeforeFetch) {
              hasFetchedDashboard.current = false;
              dashboardDataCache.current = null;
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("dashboardCache");
              }
            }
          });
    } else {
      // Call superadmin dashboard API
      privateApiCall<DashboardData>(apiEndpoint)
        .then((response) => {
          const data = {
            contactsCount: response.totalContacts || 0,
            companiesCount: response.totalCompanies || 0,
            adminUsersCount: response.totalUsers || 0,
            lastImportDate: response.lastImportDate || null,
            activityLogs: response.activityLogs || [],
            timestamp: now,
          };
          
          // Update all state and cache
          dashboardDataCache.current = data;
          // Persist cache to sessionStorage
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("dashboardCache", JSON.stringify(data));
            } catch (error) {
              console.error("Error saving dashboard cache:", error);
            }
          }
          setContactsCount(data.contactsCount);
          setCompaniesCount(data.companiesCount);
          setAdminUsersCount(data.adminUsersCount);
          setLastImportDate(data.lastImportDate);
          setActivityLogs(data.activityLogs);
          setIsLoading(false);
          setIsRefreshing(false);
          isFetching.current = false;
          hasFetchedDashboard.current = true; // Mark as fetched only after successful API call
        })
        .catch((error) => {
          console.error("Failed to fetch dashboard data:", error);
          setIsLoading(false);
          setIsRefreshing(false);
          isFetching.current = false;
          // Only clear cache if this was an initial load (not a background refresh)
          if (!hadCachedDataBeforeFetch) {
            hasFetchedDashboard.current = false;
            dashboardDataCache.current = null;
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("dashboardCache");
            }
          }
        });
    }
  }, [role, pathname]);

  // Don't render dashboard content for customers (should be redirected by layout)
  if (!role || (role !== "admin" && role !== "superadmin")) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Create mock arrays with correct length for DashboardStats component
  // The component uses .length, so we create arrays with the count length
  const contacts = Array(contactsCount).fill(null) as Contact[];
  const companies = Array(companiesCount).fill(null) as Company[];
  const users = Array(adminUsersCount).fill(null) as any[];

  return (
    <div className="space-y-6">
      <DashboardStats 
        contacts={contacts}
        companies={companies}
        users={users}
        role={role === "superadmin" ? "superadmin" : "admin"}
        adminUsersCount={adminUsersCount}
        lastImportDate={lastImportDate}
        isLoading={{
          contacts: isLoading,
          companies: isLoading,
          users: isLoading,
          importDate: isLoading
        }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {role === "superadmin" && (
          <ImportDataModule 
            onImportComplete={(newContacts, newCompanies) => {
              // Handle import complete - can be connected to state management later
              console.log("Import complete", { newContacts, newCompanies });
              // Invalidate cache and refetch
              hasFetchedDashboard.current = false;
              dashboardDataCache.current = null;
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("dashboardCache");
              }
              // Refresh dashboard data after import
              privateApiCall<DashboardData>("/admin/dashboard")
                .then((response) => {
                  const now = Date.now();
                  const data = {
                    contactsCount: response.totalContacts || 0,
                    companiesCount: response.totalCompanies || 0,
                    adminUsersCount: response.totalUsers || 0,
                    lastImportDate: response.lastImportDate || null,
                    activityLogs: response.activityLogs || [],
                    timestamp: now,
                  };
                  dashboardDataCache.current = data;
                  // Persist cache to sessionStorage
                  if (typeof window !== "undefined") {
                    try {
                      sessionStorage.setItem("dashboardCache", JSON.stringify(data));
                    } catch (error) {
                      console.error("Error saving dashboard cache:", error);
                    }
                  }
                  setContactsCount(data.contactsCount);
                  setCompaniesCount(data.companiesCount);
                  setAdminUsersCount(data.adminUsersCount);
                  setLastImportDate(data.lastImportDate);
                  setActivityLogs(data.activityLogs);
                })
                .catch((error) => {
                  console.error("Failed to refresh dashboard data:", error);
                });
            }}
          />
        )}
        {role !== "superadmin" && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a 
                href="/contacts"
                className="block w-full text-left px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Manage Contacts
              </a>
              <a 
                href="/companies"
                className="block w-full text-left px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Manage Companies
              </a>
            </div>
          </div>
        )}
        <ActivityLogsPanel 
          logs={activityLogs} 
          pagination={null}
          isLoading={isLoading} 
          isFullScreen={false}
        />
      </div>
    </div>
  );
}

