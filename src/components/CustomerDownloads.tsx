"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Calendar, FileText, Search, Trash2, TrendingUp, Clock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { privateApiCall, privateApiDelete, privateApiPost } from '@/lib/api';

interface DownloadItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  fileName: string;
  downloadUrl: string;
  date: string | Date;
  contacts: number;
  size: string;
  sizeBytes: number;
  status: string;
  type: 'csv' | 'xlsx';
  downloadCount: number;
  expiresAt?: Date | string;
}

interface DownloadsResponse {
  downloads: DownloadItem[];
  summary: {
    totalDownloads: number;
    totalContacts: number;
    lastDownload: Date | string | null;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

function formatDateShort(date: Date | string): { month: string; day: string; year: string } {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    month: months[d.getMonth()],
    day: String(d.getDate()),
    year: String(d.getFullYear()),
  };
}

export default function CustomerDownloads() {
  const [downloads, setDownloads] = useState([] as DownloadItem[]);
  const [summary, setSummary] = useState({
    totalDownloads: 0,
    totalContacts: 0,
    lastDownload: null as Date | string | null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [deletingId, setDeletingId] = useState(null as string | null);
  const [downloadingId, setDownloadingId] = useState(null as string | null);
  const fetchInProgressRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDownloads = useCallback(async (search: string = '') => {
    // Prevent concurrent API calls
    if (fetchInProgressRef.current) {
      return;
    }

    try {
      fetchInProgressRef.current = true;
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      params.append('limit', '10'); // Show recent 10 downloads

      const response = await privateApiCall<DownloadsResponse>(
        `/customers/downloads?${params.toString()}`
      );

      setDownloads(response.downloads);
      setSummary(response.summary);
    } catch (err: any) {
      console.error('Error fetching downloads:', err);
      setError(err.message || 'Failed to fetch downloads');
      setDownloads([]);
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  // Consolidated fetch effect - handles initial load and search debounce
  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Use 0 delay for empty search (initial load or clear), 500ms for typing
    const delay = searchTerm ? 500 : 0;

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      fetchDownloads(searchTerm);
    }, delay);

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm, fetchDownloads]);

  const handleDownload = async (download: DownloadItem) => {
    try {
      setDownloadingId(download.id);

      // Track download count by calling the invoices API
      try {
        await privateApiPost(`/customers/payment/invoices`, { invoiceId: download.invoiceId });
      } catch (err) {
        // Continue even if tracking fails
        console.error('Error tracking download:', err);
      }

      // Download the file
      if (download.downloadUrl) {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = download.downloadUrl;
        link.download = download.fileName || 'download.xlsx';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      console.error('Error downloading file:', err);
      alert('Failed to download file. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (download: DownloadItem) => {
    if (!confirm(`Are you sure you want to delete "${download.fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(download.id);
      await privateApiDelete(`/customers/downloads?invoiceId=${download.invoiceId}`);

      // Remove from local state
      setDownloads(downloads.filter((d: any) => d.id !== download.id));
      setSummary((prev: any) => ({
        ...prev,
        totalDownloads: prev.totalDownloads - 1,
        totalContacts: prev.totalContacts - download.contacts,
      }));
    } catch (err: any) {
      console.error('Error deleting download:', err);
      alert('Failed to delete file. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const lastDownloadDate = summary.lastDownload
    ? formatDateShort(summary.lastDownload)
    : { month: 'N/A', day: '', year: '' };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#030000]">My Downloads</h1>
            <p className="text-gray-600 mt-1">Access and manage your downloaded contact files</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search downloads..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Downloads</p>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-2" />
                  ) : (
                    <>
                      <p className="text-[#030000] text-2xl">{summary.totalDownloads}</p>
                      <p className="text-gray-500 text-xs">files stored</p>
                    </>
                  )}
                </div>
              </div>
              <TrendingUp className="text-blue-500 opacity-20 group-hover:opacity-40 transition-opacity" size={32} />
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-200 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Download className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Contacts</p>
                  {isLoading ? (
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-2" />
                  ) : (
                    <>
                      <p className="text-[#030000] text-2xl">{summary.totalContacts}</p>
                      <p className="text-gray-500 text-xs">contacts downloaded</p>
                    </>
                  )}
                </div>
              </div>
              <TrendingUp className="text-green-500 opacity-20 group-hover:opacity-40 transition-opacity" size={32} />
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Calendar className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Last Download</p>
                  {isLoading ? (
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-2" />
                  ) : (
                    <>
                      <p className="text-[#030000] text-2xl">{lastDownloadDate.month} {lastDownloadDate.day}</p>
                      <p className="text-gray-500 text-xs">{lastDownloadDate.year}</p>
                    </>
                  )}
                </div>
              </div>
              <Clock className="text-purple-500 opacity-20 group-hover:opacity-40 transition-opacity" size={32} />
            </div>
          </div>
        </div>

        {/* Downloads Grid - Card Style Instead of Table */}
        {isLoading ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse relative overflow-hidden">
                  <div className="relative flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-200" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-4 space-y-2">
                          <div className="h-5 w-40 bg-gray-200 rounded" />
                          <div className="flex items-center gap-3">
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                          </div>
                        </div>
                        <div className="h-6 w-12 bg-gray-200 rounded-lg" />
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-8 w-32 bg-gray-200 rounded-lg" />
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-10 flex-1 bg-gray-200 rounded-xl" />
                        <div className="h-10 w-10 bg-gray-200 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : downloads.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-[#030000] text-xl mb-2">No Downloads Yet</h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'No downloads found matching your search.'
                : 'Your downloaded files will appear here after you complete a purchase.'}
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#030000]">Recent Downloads</h2>
              <button
                onClick={() => window.location.hash = 'all-downloads'}
                className="px-4 py-2 text-sm text-gray-600 hover:text-[#2563EB] transition-colors flex items-center gap-2"
              >
                <span>View All</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {downloads.map((download: any) => (
                <div
                  key={download.id}
                  className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#2563EB]/30 transition-all relative overflow-hidden"
                >
                  {/* Decorative gradient */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#2563EB]/5 to-[#EB432F]/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

                  <div className="relative flex items-start gap-4">
                    {/* File Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#EB432F]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform relative">
                      <FileText className="text-[#2563EB]" size={28} />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle className="text-white" size={14} />
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="text-[#030000] truncate group-hover:text-[#2563EB] transition-colors mb-1">
                            {download.fileName}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(download.date)}
                            </span>
                            <span>•</span>
                            <span>{download.size}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wide ${download.type === 'csv'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                          }`}>
                          {download.type}
                        </span>
                      </div>

                      {/* Stats Bar */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                          <Download size={14} className="text-gray-600" />
                          <span className="text-sm text-[#030000]">{download.contacts} contacts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600">{download.status}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(download)}
                          disabled={downloadingId === download.id}
                          className="flex-1 group/btn px-4 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#EB432F] text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700"></div>
                          {downloadingId === download.id ? (
                            <Loader2 size={16} className="relative z-10 animate-spin" />
                          ) : (
                            <Download size={16} className="relative z-10" />
                          )}
                          <span className="relative z-10">Download Again</span>
                        </button>
                        <button
                          onClick={() => handleDelete(download)}
                          disabled={deletingId === download.id}
                          className="p-2.5 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group/del disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === download.id ? (
                            <Loader2 size={16} className="text-red-600 animate-spin" />
                          ) : (
                            <Trash2 size={16} className="text-gray-600 group-hover/del:text-red-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Card - Enhanced */}
        <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-200 rounded-2xl p-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-2xl"></div>

          <div className="relative flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-xl">
              <FileText className="text-white" size={32} />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-[#030000] mb-2">📦 Download History & Storage</h3>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    All your downloaded files are <span className="text-blue-600 px-2 py-0.5 bg-blue-100 rounded">securely stored for 7 days</span>. After that, they will be automatically removed from our servers to ensure your privacy.
                  </p>
                  <div className="flex items-start gap-2 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-200">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-700 text-sm">
                      <strong>Need to re-download?</strong> Simply click "Download Again" on any file to download it again. Your files are saved and accessible from this page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
