"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ContactsTable } from "@/components/ContactsTable";
import { FilterPanel } from "@/components/FilterPanel";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { getContacts, clearPendingFilters, type GetContactsParams } from "@/store/slices/contacts.slice";
import type { Company, User, Contact } from "@/types/dashboard.types";

export default function ContactsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user} = useAppSelector((state) => state.auth);
  const [companies] = useState([] as any);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
  } as GetContactsParams);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const previousPathname = useRef(null as string | null);

  const dashboardUser: User | null = user ? {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
    role: user.role || null,
  } : null;

  // Get pendingFilters from state alongside other contact state
  const { contacts, pagination, isLoading, isRefreshing, error, lastFetchParams, pendingFilters } = useAppSelector((state) => state.contacts);

  // Handle pending filters from other pages (Redux state transfer)
  useEffect(() => {
    if (pendingFilters) {
      setFilters((prev: GetContactsParams) => ({
        ...prev,
        ...pendingFilters,
        page: 1
      }));
      // Clear the pending filters from Redux once applied
      dispatch(clearPendingFilters());
    }
  }, [pendingFilters, dispatch]);

  // Debounce search query with 1 second delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset page to 1 when search changes
      if (searchQuery !== debouncedSearchQuery) {
        setFilters((prev: GetContactsParams) => ({ ...prev, page: 1 }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery]);

  const searchParams = useSearchParams();

  // Listen for URL query parameters (specifically industry)
  useEffect(() => {
    const industryParam = searchParams.get('industry');
    if (industryParam) {
      setFilters((prev: GetContactsParams) => ({
        ...prev,
        industry: industryParam,
        page: 1,
      }));
    }
  }, [searchParams]);



  // Helper function to check if params match
  const paramsMatch = (params1: GetContactsParams | null, params2: GetContactsParams): boolean => {
    if (!params1) return false;
    const keys = new Set([...Object.keys(params1), ...Object.keys(params2)]);
    for (const key of keys) {
      if (params1[key as keyof GetContactsParams] !== params2[key as keyof GetContactsParams]) {
        return false;
      }
    }
    return true;
  };

  // Fetch contacts when filters, debounced search change, or when navigating to this page
  // Note: Filters are only applied when "Apply Filters" is clicked, but pagination/search work immediately
  useEffect(() => {
    // Clean empty values before API call
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => {
        // Keep page and limit, remove empty strings
        if (typeof value === 'number') return true;
        return value !== '' && value !== null && value !== undefined;
      })
    ) as GetContactsParams;

    const fetchParams: GetContactsParams = {
      ...cleanedFilters,
      search: debouncedSearchQuery || undefined,
    };

    // Check if we navigated to this page (pathname changed to /contacts)
    const isNavigationToPage = previousPathname.current !== pathname && pathname === '/contacts';

    // Check if we have cached data for the same params
    const hasCachedData = paramsMatch(lastFetchParams, fetchParams) && contacts.length > 0;

    // Always fetch when:
    // 1. No data exists AND we've never fetched before
    // 2. Params changed (filters or search changed)
    // 3. Navigating to this page - if we have cached data, refresh in background; otherwise show loader
    const shouldFetch =
      (contacts.length === 0 && lastFetchParams === null) ||
      !paramsMatch(lastFetchParams, fetchParams) ||
      isNavigationToPage;

    if (shouldFetch) {
      // If we have cached data for same params, fetch in background
      // Otherwise, fetch normally (will show loader)
      const background = hasCachedData && paramsMatch(lastFetchParams, fetchParams);
      dispatch(getContacts({ ...fetchParams, background }));
      previousPathname.current = pathname;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters, debouncedSearchQuery, lastFetchParams, pathname]);

  // Handle page change
  const handlePageChange = (page: number) => {
    // Only update if page actually changed
    if (filters.page !== page) {
      setFilters((prev: GetContactsParams) => ({ ...prev, page }));
    }
  };

  // Handle limit change
  const handleLimitChange = (limit: number) => {
    setFilters((prev: GetContactsParams) => ({ ...prev, limit, page: 1 }));
  };

  // Handle search change (immediate update for input, debounced for API)
  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    // Don't reset page here, let debounced search handle it
  };

  // Handle filter change from FilterPanel (called when Apply Filters is clicked)
  const handleFilterChange = (newFilters: Partial<GetContactsParams>) => {
    // If all filter values are undefined, it means Clear All was clicked
    const hasOnlyDefaults = Object.keys(newFilters).every(key => {
      const value = newFilters[key as keyof GetContactsParams];
      return key === 'page' || key === 'limit' || value === undefined || value === null || value === '';
    });

    if (hasOnlyDefaults && Object.keys(newFilters).length > 2) {
      // Clear All was clicked - reset to default state
      setFilters({
        page: 1,
        limit: 25,
      });
    } else {
      // Apply filters - merge with existing filters
      setFilters((prev: GetContactsParams) => {
        const updated = { ...prev, ...newFilters, page: 1 };
        // Remove undefined values
        Object.keys(updated).forEach(key => {
          if (updated[key as keyof GetContactsParams] === undefined) {
            delete updated[key as keyof GetContactsParams];
          }
        });
        return updated;
      });
    }
  };

  if (!dashboardUser) return null;

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ height: '100vh', maxHeight: '100vh' }}>
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden p-6`} style={{ height: 'calc(100vh - 0px)', maxHeight: 'calc(100vh - 0px)' }}>
        <ContactsTable
          contacts={contacts}
          user={dashboardUser}
          companies={companies}
          filters={filters}
          searchQuery={searchQuery}
          pagination={pagination}
          isLoading={isLoading}
          error={error}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onViewContact={(contact: Contact) => {
            // Navigate to contact detail page
            // Handle both _id and id fields for compatibility
            const contactId = contact.id || (contact as any)._id;
            if (contactId) {
              router.push(`/contacts/${contactId}`);
            } else {
              console.error('Contact ID is missing:', contact);
            }
          }}
        />
      </div>
    </div>
  );
}

