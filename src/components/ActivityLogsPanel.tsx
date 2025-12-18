import React from 'react';
import { Activity, Upload, Edit, Trash2, UserPlus, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Skeleton } from './ui/skeleton';
import type { ActivityLog } from '@/types/dashboard.types';

interface ActivityLogsPanelProps {
  logs: ActivityLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  isLoading?: boolean;
  error?: string | null;
  userRole?: 'superadmin' | 'admin' | 'customer' | null;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  isFullScreen?: boolean;
}

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'data import':
      return Upload;
    case 'contact added':
    case 'company added':
    case 'user added':
      return UserPlus;
    case 'contact updated':
    case 'company updated':
    case 'user updated':
      return Edit;
    case 'contact deleted':
    case 'company deleted':
    case 'user deleted':
      return Trash2;
    case 'data export':
      return Download;
    default:
      return Activity;
  }
};

const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'data import':
      return 'bg-green-100 text-green-800';
    case 'contact added':
    case 'company added':
    case 'user added':
      return 'bg-blue-100 text-blue-800';
    case 'contact updated':
    case 'company updated':
    case 'user updated':
      return 'bg-yellow-100 text-yellow-800';
    case 'contact deleted':
    case 'company deleted':
    case 'user deleted':
      return 'bg-red-100 text-red-800';
    case 'data export':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const ActivityLogsPanel = React.memo(function ActivityLogsPanel({ 
  logs, 
  pagination,
  isLoading = false, 
  error = null,
  userRole = null,
  onPageChange,
  onLimitChange,
  isFullScreen = false
}: ActivityLogsPanelProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  // Pagination values
  const currentPage = pagination?.currentPage || 1;
  const rowsPerPage = pagination?.limit || 25;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.totalCount || 0;
  const startIndex = pagination ? (pagination.currentPage - 1) * pagination.limit : 0;

  const handlePageNavigation = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handleRowsPerPageChange = (value: string) => {
    if (onLimitChange) {
      onLimitChange(Number(value));
      // Reset to page 1 when changing rows per page
      if (onPageChange) {
        onPageChange(1);
      }
    }
  };

  // Calculate which page numbers to show (up to 5 pages)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPages = Math.min(5, totalPages);
    
    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const themeColor = '#2563EB';

  // Full screen layout
  if (isFullScreen) {
    return (
      <div className="flex flex-col h-full w-full bg-white">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
          
          <div className="relative px-6 py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Icon Badge with Gradient */}
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                  <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-50 blur-lg" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Activity Logs
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Real-time system activity tracking</p>
                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="space-y-0 bg-white rounded-lg border border-gray-200">
              {[...Array(10)].map((_, index) => (
                <div key={index}>
                  <div className="flex items-start gap-4 py-4 px-6">
                    {/* Icon Skeleton */}
                    <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                    
                    {/* Content Skeleton */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>  
                    </div>
                  </div>
                  {index < 9 && <div className="border-b border-gray-100 mx-6" />}
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-red-300 mx-auto mb-4" />
              <p className="text-red-500">{error}</p>
            </div>
          ) : logs.length > 0 ? (
            <div className="space-y-0 bg-white rounded-lg border border-gray-200">
              {logs.map((log, index) => {
                const Icon = getActionIcon(log.action);
                const colorClass = getActionColor(log.action);
                
                return (
                  <div key={log.id}>
                    <div className="flex items-start gap-4 py-4 px-6 hover:bg-gray-50 transition-colors">
                      {/* Icon */}
                      <div className={`flex-shrink-0 p-2.5 rounded-lg ${colorClass} mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-2.5 leading-relaxed">
                          {log.description || log.details || log.action}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium">Created by: {log.createdBy || log.userName || log.user || "Unknown"}</span>
                          <span className="font-medium">{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Divider - show only if not last item */}
                    {index < logs.length - 1 && (
                      <div className="border-b border-gray-100 mx-6"></div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activity logs yet</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Label>Rows per page:</Label>
              <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalCount)} of {totalCount} results
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageNavigation(Math.max(currentPage - 1, 1))}
                disabled={!pagination?.hasPreviousPage || currentPage === 1 || isLoading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex space-x-1">
                {pageNumbers.map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageNavigation(pageNum)}
                    style={currentPage === pageNum ? { backgroundColor: themeColor } : {}}
                    disabled={isLoading}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageNavigation(Math.min(currentPage + 1, totalPages))}
                disabled={!pagination?.hasNextPage || currentPage === totalPages || isLoading}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original card layout (for dashboard preview)
  return (
    <div className="relative overflow-hidden border-0 shadow-lg rounded-lg bg-white">
      {/* Top Gradient Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
      
      {/* Decorative Background Orbs */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative px-6 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Icon Badge with Gradient */}
            <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
              
              {/* Icon Glow Effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-50 blur-lg" />
            </div>
            
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Activity Logs
              </h2>
              <p className="text-xs text-gray-500 mt-1">Real-time system activity tracking</p>
            </div>
          </div>
          
        </div>
      </div>
      <div className="relative px-6 pb-6">
        <div className="max-h-96 overflow-y-auto pr-4">
          <div className="space-y-0">
            {isLoading ? (
              <div className="space-y-0">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="py-4 px-1">
                    <div className="flex items-start gap-4">
                      {/* Icon Skeleton */}
                      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                      
                      {/* Content Skeleton */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                    {index < 4 && <div className="border-b border-gray-100 mx-1 mt-4" />}
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-red-300 mx-auto mb-4" />
                <p className="text-red-500">{error}</p>
              </div>
            ) : logs.length > 0 ? (
              logs.map((log, index) => {
                const Icon = getActionIcon(log.action);
                const colorClass = getActionColor(log.action);
                
                return (
                  <div key={log.id}>
                    <div className="flex items-start gap-4 py-4 px-1 hover:bg-gray-50 transition-colors rounded-md">
                      {/* Icon */}
                      <div className={`flex-shrink-0 p-2.5 rounded-lg ${colorClass} mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-2.5 leading-relaxed">
                          {log.description || log.details || log.action}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium">Created by: {log.createdBy || log.userName || log.user || "Unknown"}</span>
                          <span className="font-medium">{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Divider - show only if not last item */}
                    {index < logs.length - 1 && (
                      <div className="border-b border-gray-100 mx-1"></div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No activity logs yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Gradient Border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
    </div>
  );
});