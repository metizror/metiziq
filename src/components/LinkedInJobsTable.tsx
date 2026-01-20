"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { Search, ChevronLeft, ChevronRight, Eye, ExternalLink, Building2, MapPin, Briefcase, Calendar, X } from "lucide-react";
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
    linkedin_org_url?: string;
    external_apply_url?: string;
    company_site?: string;
    seniority?: string;
    date_posted?: string;
    [key: string]: any;
}

interface LinkedInJobsTableProps {
    jobs: LinkedInJob[];
    user: User;
    filters?: {
        page: number;
        limit: number;
        dateFrom?: string;
        dateTo?: string;
    };
    searchQuery?: string;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    } | null;
    isLoading?: boolean;
    error?: string | null;
    onSearchChange?: (search: string) => void;
    onPageChange?: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    onDateFilterChange?: (dateFrom?: string, dateTo?: string) => void;
    onViewJob?: (job: LinkedInJob) => void;
}

export function LinkedInJobsTable({
    jobs,
    user,
    filters = { page: 1, limit: 10 },
    searchQuery = "",
    pagination = null,
    isLoading = false,
    error = null,
    onSearchChange,
    onPageChange,
    onLimitChange,
    onDateFilterChange,
    onViewJob,
}: LinkedInJobsTableProps) {
    const [dateFilterType, setDateFilterType] = useState<string>("all");
    const [customDateFrom, setCustomDateFrom] = useState<string>("");
    const [customDateTo, setCustomDateTo] = useState<string>("");
    const currentPage = pagination?.currentPage || 1;
    const rowsPerPage = pagination?.limit || 10;
    const totalPages = pagination?.totalPages || 1;
    const totalCount = pagination?.totalCount || 0;
    const startIndex = (currentPage - 1) * rowsPerPage;

    const handleSearchInputChange = (value: string) => {
        if (onSearchChange) {
            onSearchChange(value);
        }
    };

    const handlePageNavigation = (page: number) => {
        if (onPageChange) {
            onPageChange(page);
        }
    };

    const handleRowsPerPageChange = (value: string) => {
        const limit = parseInt(value, 10);
        if (onLimitChange) {
            onLimitChange(limit);
        }
    };

    const handleDateFilterTypeChange = (value: string) => {
        setDateFilterType(value);
        if (value === "all") {
            setCustomDateFrom("");
            setCustomDateTo("");
            if (onDateFilterChange) {
                onDateFilterChange(undefined, undefined);
            }
        } else if (value === "custom") {
            // Keep custom dates, but don't apply until user selects dates
            if (customDateFrom && customDateTo && onDateFilterChange) {
                onDateFilterChange(customDateFrom, customDateTo);
            }
        } else {
            // Quick date filters
            const today = new Date();
            let fromDate: Date;

            switch (value) {
                case "last7":
                    fromDate = new Date(today);
                    fromDate.setDate(today.getDate() - 7);
                    break;
                case "last30":
                    fromDate = new Date(today);
                    fromDate.setDate(today.getDate() - 30);
                    break;
                case "last90":
                    fromDate = new Date(today);
                    fromDate.setDate(today.getDate() - 90);
                    break;
                default:
                    fromDate = new Date(0); // All time
            }

            const fromDateStr = fromDate.toISOString().split('T')[0];
            const toDateStr = today.toISOString().split('T')[0];

            setCustomDateFrom("");
            setCustomDateTo("");

            if (onDateFilterChange) {
                onDateFilterChange(fromDateStr, toDateStr);
            }
        }
    };

    const handleCustomDateChange = () => {
        if (customDateFrom && customDateTo && onDateFilterChange) {
            onDateFilterChange(customDateFrom, customDateTo);
        } else if (!customDateFrom && !customDateTo && onDateFilterChange) {
            onDateFilterChange(undefined, undefined);
        }
    };

    const clearDateFilter = () => {
        setDateFilterType("all");
        setCustomDateFrom("");
        setCustomDateTo("");
        if (onDateFilterChange) {
            onDateFilterChange(undefined, undefined);
        }
    };

    // Sync date filter type with filters prop
    useEffect(() => {
        if (!filters.dateFrom && !filters.dateTo) {
            if (dateFilterType !== "all") {
                setDateFilterType("all");
            }
        } else if (filters.dateFrom && filters.dateTo) {
            // Check if it matches a quick filter
            const today = new Date();
            const fromDate = new Date(filters.dateFrom);
            const toDate = new Date(filters.dateTo);

            const daysDiff = Math.floor((today.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff === 7 && toDate.toDateString() === today.toDateString()) {
                setDateFilterType("last7");
            } else if (daysDiff === 30 && toDate.toDateString() === today.toDateString()) {
                setDateFilterType("last30");
            } else if (daysDiff === 90 && toDate.toDateString() === today.toDateString()) {
                setDateFilterType("last90");
            } else {
                setDateFilterType("custom");
                setCustomDateFrom(filters.dateFrom);
                setCustomDateTo(filters.dateTo);
            }
        }
    }, [filters.dateFrom, filters.dateTo]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    return (
        <Card className="flex flex-col h-full shadow-lg">
            <CardHeader className="flex-shrink-0 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <CardTitle className="text-2xl font-bold">LinkedIn Jobs</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Browse all available positions</p>
                    </div>
                    <Badge variant="secondary" className="text-sm px-3 py-1.5 font-medium">Total {totalCount} {totalCount === 1 ? 'Job' : 'Jobs'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" style={{ marginTop: "10px" }} />
                        <Input
                            placeholder="Search by title, company, location..."
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchInputChange(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Select value={dateFilterType} onValueChange={handleDateFilterTypeChange}>
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue placeholder="Date filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All time</SelectItem>
                                    <SelectItem value="last7">Last 7 days</SelectItem>
                                    <SelectItem value="last30">Last 30 days</SelectItem>
                                    <SelectItem value="last90">Last 90 days</SelectItem>
                                    <SelectItem value="custom">Custom range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {dateFilterType === "custom" && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    placeholder="From"
                                    value={customDateFrom}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const newValue = e.target.value;
                                        setCustomDateFrom(newValue);
                                        if (newValue && customDateTo) {
                                            if (onDateFilterChange) {
                                                onDateFilterChange(newValue, customDateTo);
                                            }
                                        } else if (!newValue && onDateFilterChange) {
                                            // Clear filter if from date is removed
                                            onDateFilterChange(undefined, undefined);
                                        }
                                    }}
                                    className="h-9 w-[140px]"
                                />
                                <span className="text-muted-foreground text-sm">to</span>
                                <Input
                                    type="date"
                                    placeholder="To"
                                    value={customDateTo}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const newValue = e.target.value;
                                        setCustomDateTo(newValue);
                                        if (customDateFrom && newValue) {
                                            if (onDateFilterChange) {
                                                onDateFilterChange(customDateFrom, newValue);
                                            }
                                        } else if (!newValue && onDateFilterChange) {
                                            // Clear filter if to date is removed
                                            onDateFilterChange(undefined, undefined);
                                        }
                                    }}
                                    className="h-9 w-[140px]"
                                    min={customDateFrom || undefined}
                                />
                            </div>
                        )}
                        {(filters.dateFrom || filters.dateTo) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearDateFilter}
                                className="h-9 px-2"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden p-0">
                <div
                    className="overflow-y-auto overflow-x-auto flex-1"
                    style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#2563EB #f1f1f1",
                        minHeight: 0,
                        maxHeight: "100%",
                    }}
                >
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 border-b">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold py-3 px-4">
                                    <div className="flex items-center">Job Title</div>
                                </TableHead>
                                <TableHead className="font-semibold py-3 px-4">
                                    <div className="flex items-center">Company</div>
                                </TableHead>
                                <TableHead className="font-semibold py-3 px-4">
                                    <div className="flex items-center">Location</div>
                                </TableHead>
                                <TableHead className="font-semibold py-3 px-4">
                                    <div className="flex items-center">Type</div>
                                </TableHead>
                                <TableHead className="font-semibold py-3 px-4">
                                    <div className="flex items-center">Remote</div>
                                </TableHead>
                                <TableHead className="font-semibold py-3 px-4">
                                    <div className="flex items-center">Posted</div>
                                </TableHead>
                                <TableHead className="font-semibold py-3 px-4 text-center">
                                    <div className="flex items-center justify-center">Actions</div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <>
                                    {[...Array(10)].map((_, index) => (
                                        <TableRow key={`skeleton-${index}`}>
                                            <TableCell className="py-4 px-4">
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-full" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-20" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <Skeleton className="h-4 w-24" />
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <Skeleton className="h-6 w-20 rounded-full" />
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <Skeleton className="h-6 w-16 rounded-full" />
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <Skeleton className="h-4 w-20" />
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Skeleton className="h-8 w-16" />
                                                    <Skeleton className="h-8 w-8 rounded" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 px-4 text-red-600">
                                        {error}
                                    </TableCell>
                                </TableRow>
                            ) : jobs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 px-4 text-muted-foreground">
                                        No jobs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                jobs.map((job: LinkedInJob) => {
                                    const jobId = job._id || job.id || job.job_id;
                                    return (
                                        <TableRow
                                            key={jobId}
                                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={(e: React.MouseEvent) => {
                                                const target = e.target as HTMLElement;
                                                if (!target.closest('button') && !target.closest('a')) {
                                                    onViewJob?.(job);
                                                }
                                            }}
                                        >
                                            <TableCell className="py-4 px-4">
                                                <div className="space-y-1.5">
                                                    <div className="font-semibold text-foreground line-clamp-2 leading-tight">
                                                        {job.title || "No Title"}
                                                    </div>
                                                    {job.seniority && (
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <Briefcase className="h-3.5 w-3.5" />
                                                            <span>{job.seniority}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <div className="space-y-1.5">
                                                    <div className="font-medium text-foreground line-clamp-1 flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <span>{job.organization || "-"}</span>
                                                    </div>
                                                    {job.linkedin_org_size && (
                                                        <div className="text-xs text-muted-foreground ml-6">{job.linkedin_org_size}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <div className="flex items-center gap-2 text-sm text-foreground">
                                                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="line-clamp-1">{job.location || "-"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                {Array.isArray(job.employment_type) && job.employment_type.length > 0 ? (
                                                    <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                                                        {job.employment_type[0].replace("_", " ")}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                {job.remote_derived !== undefined ? (
                                                    <Badge
                                                        variant={job.remote_derived ? "default" : "outline"}
                                                        className="text-xs font-medium px-2 py-0.5"
                                                    >
                                                        {job.remote_derived ? "Yes" : "No"}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-sm text-muted-foreground">
                                                {formatDate(job.date_posted)}
                                            </TableCell>
                                            <TableCell className="py-4 px-4" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onViewJob?.(job)}
                                                        className="h-8 px-3"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                        View
                                                    </Button>
                                                    {(job.company_site || job.external_apply_url) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <a
                                                                href={job.company_site || job.external_apply_url || "#"}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div
                    className="flex items-center justify-between px-6 py-4 border-t bg-background"
                    style={{ flexShrink: 0, flexGrow: 0 }}
                >
                    <div className="flex items-center space-x-3">
                        <Label className="text-sm font-medium text-foreground">Rows per page:</Label>
                        <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                            <SelectTrigger className="w-20 h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                            <span className="font-medium text-foreground">{Math.min(startIndex + rowsPerPage, totalCount)}</span> of{" "}
                            <span className="font-medium text-foreground">{totalCount}</span>
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageNavigation(Math.max(currentPage - 1, 1))}
                            disabled={!pagination?.hasPreviousPage || currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </Button>

                        <div className="flex space-x-1">
                            {(() => {
                                const pages: number[] = [];
                                if (totalPages <= 5) {
                                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                                } else if (currentPage <= 3) {
                                    pages.push(1, 2, 3, 4, 5);
                                } else if (currentPage >= totalPages - 2) {
                                    pages.push(
                                        totalPages - 4,
                                        totalPages - 3,
                                        totalPages - 2,
                                        totalPages - 1,
                                        totalPages
                                    );
                                } else {
                                    pages.push(
                                        currentPage - 2,
                                        currentPage - 1,
                                        currentPage,
                                        currentPage + 1,
                                        currentPage + 2
                                    );
                                }

                                return pages.map((pageNum) => (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageNavigation(pageNum)}
                                        className="w-9 h-9"
                                        style={
                                            currentPage === pageNum
                                                ? { backgroundColor: user.role === "superadmin" ? "#2563EB" : "#EB432F" }
                                                : {}
                                        }
                                    >
                                        {pageNum}
                                    </Button>
                                ));
                            })()}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageNavigation(Math.min(currentPage + 1, totalPages))}
                            disabled={!pagination?.hasNextPage || currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
