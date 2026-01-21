"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LinkedInJobsTable } from "@/components/LinkedInJobsTable";
import { useAppSelector } from "@/store/hooks";
import { privateApiCall } from "@/lib/api";
import type { User } from "@/types/dashboard.types";

interface LinkedInJob {
  _id?: string;
  id?: string;
  job_id?: string;
  title?: string;
  organization?: string;
  location?: string;
  description_text?: string;
  employment_type?: string[];
  remote_derived?: boolean;
  linkedin_org_size?: string;
  linkedin_org_type?: string;
  linkedin_org_industry?: string;
  created_at?: string;
  [key: string]: any;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function LinkedInJobsListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAppSelector((state: any) => state.auth);
  const [jobs, setJobs] = useState<LinkedInJob[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    dateFrom: undefined as string | undefined,
    dateTo: undefined as string | undefined,
    typeFilters: [] as string[],
    remote: "all" as "all" | "true" | "false",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const previousPathname = useRef<string | null>(null);
  const hasFetchedRef = useRef(false);

  const dashboardUser: User | null = useMemo(() => user
    ? {
      id: user.id,
      email: user.email,
      name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
      role: user.role || null,
    }
    : null, [user]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (debouncedSearchQuery && hasFetchedRef.current) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearchQuery]);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      if (!dashboardUser) return;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(filters.page),
          limit: String(filters.limit),
        });

        if (debouncedSearchQuery) {
          params.append("search", debouncedSearchQuery);
        }

        if (filters.dateFrom) {
          params.append("date_from", filters.dateFrom);
        }

        if (filters.dateTo) {
          params.append("date_to", filters.dateTo);
        }

        if (filters.typeFilters.length > 0) {
          params.append("type", filters.typeFilters.join(","));
        }

        if (filters.remote !== "all") {
          params.append("remote", filters.remote);
        }

        const response = await privateApiCall<{
          success: boolean;
          jobs: LinkedInJob[];
          pagination: Pagination;
        }>(`/linkedin-jobs?${params.toString()}`);

        if (response.success) {
          setJobs(response.jobs || []);
          setPagination(response.pagination || null);
          hasFetchedRef.current = true;
        } else {
          setError("Failed to fetch jobs");
        }
      } catch (err: any) {
        console.error("Error fetching LinkedIn jobs:", err);
        setError(err.message || "Failed to fetch LinkedIn jobs");
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if user is available
    if (dashboardUser) {
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.page,
    filters.limit,
    filters.dateFrom,
    filters.dateTo,
    filters.remote,
    // re-fetch when type filters change (array reference changes on update)
    filters.typeFilters,
    debouncedSearchQuery,
  ]);

  const handlePageChange = (page: number) => {
    if (filters.page !== page) {
      setFilters((prev) => ({ ...prev, page }));
    }
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
  };

  const handleDateFilterChange = (dateFrom?: string, dateTo?: string) => {
    setFilters((prev) => ({
      ...prev,
      dateFrom,
      dateTo,
      page: 1, // Reset to first page when date filter changes
    }));
  };

  const handleTypeFilterChange = (typeFilters: string[]) => {
    setFilters((prev) => ({
      ...prev,
      typeFilters,
      page: 1,
    }));
  };

  const handleRemoteFilterChange = (remote: "all" | "true" | "false") => {
    setFilters((prev) => ({
      ...prev,
      remote,
      page: 1,
    }));
  };

  const handleViewJob = (job: LinkedInJob) => {
    const jobId = job._id || job.id || job.job_id;
    if (jobId) {
      router.push(`/linkedin-jobs-list/${jobId}`);
    } else {
      console.error("Job ID is missing:", job);
    }
  };

  if (!dashboardUser) return null;

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ height: "100vh", maxHeight: "100vh" }}>
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-hidden p-6`}
        style={{ height: "calc(100vh - 0px)", maxHeight: "calc(100vh - 0px)" }}
      >
        <LinkedInJobsTable
          jobs={jobs}
          user={dashboardUser}
          filters={filters}
          searchQuery={searchQuery}
          pagination={pagination}
          isLoading={isLoading}
          error={error}
          onSearchChange={handleSearchChange}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onDateFilterChange={handleDateFilterChange}
          onTypeFilterChange={handleTypeFilterChange}
          onRemoteFilterChange={handleRemoteFilterChange}
          onViewJob={handleViewJob}
        />
      </div>
    </div>
  );
}
