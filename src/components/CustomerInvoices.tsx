"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  TrendingUp,
  CreditCard,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { privateApiCall } from "@/lib/api";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  type: "contacts" | "companies";
  itemCount: number;
  pricePerItem: number;
  subtotal: number;
  tax?: number;
  total: number;
  currency: string;
  paymentMethod: "paypal" | "stripe" | "other";
  paymentStatus: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  paymentId?: string;
  paymentDetails?: {
    payerId?: string;
    payerEmail?: string;
    transactionId?: string;
    paymentDate?: Date;
  };
  downloadUrl?: string;
  fileName?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface InvoicesResponse {
  invoices: Invoice[];
  summary: {
    totalInvoices: number;
    totalPaid: number;
    lastPayment: Date | string | null;
    allPaid: boolean;
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

function formatDate(date: Date | string | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

function formatPaymentMethod(method: string): string {
  switch (method) {
    case "paypal":
      return "PayPal";
    case "stripe":
      return "Card";
    default:
      return method.charAt(0).toUpperCase() + method.slice(1);
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "cancelled":
      return "bg-orange-100 text-orange-700";
    case "refunded":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Paid";
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "contacts":
      return "Contacts Purchase";
    case "companies":
      return "Companies Purchase";
    default:
      return type;
  }
}

export default function CustomerInvoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [invoices, setInvoices] = useState([] as Invoice[]);
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalPaid: 0,
    lastPayment: null as Date | string | null,
    allPaid: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [downloadingId, setDownloadingId] = useState(null as string | null);
  const fetchInProgressRef = useRef(false);
  const debounceTimeoutRef = useRef(null);

  const fetchInvoices = useCallback(async (search: string = "", status: string = "all") => {
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
        params.append("search", search);
      }
      if (status !== "all") {
        params.append("status", status);
      }
      params.append("limit", "10");

      const response = await privateApiCall<InvoicesResponse>(
        `/customers/payment/invoices?${params.toString()}`
      );

      setInvoices(response.invoices);
      setSummary(response.summary);
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      setError(err.message || "Failed to fetch invoices");
      setInvoices([]);
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
    const delay = searchTerm || filterStatus !== "all" ? 500 : 0;

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      fetchInvoices(searchTerm, filterStatus);
    }, delay);

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm, filterStatus, fetchInvoices]);

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setDownloadingId(invoice._id);

      // Get auth token from localStorage
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      if (!token) {
        alert("Please login again to download the invoice.");
        return;
      }

      // Fetch PDF from API
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
      const response = await fetch(
        `${apiBaseUrl}/customers/payment/invoices/${invoice._id}/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate PDF");
      }

      // Get PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Error downloading PDF:", err);
      alert(err.message || "Failed to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportAll = () => {
    // Export all invoices as CSV or Excel
    // For now, we'll show an alert - you can implement export functionality later
    alert("Export functionality will be implemented soon.");
  };

  const filteredInvoices = invoices; // Already filtered by API

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#030000]">Invoices & Payment History</h1>
            <p className="text-gray-600 mt-1">
              Track all your billing and payment transactions
            </p>
          </div>
          <button
            onClick={handleExportAll}
            className="px-6 py-3 bg-gradient-to-r from-[#EF8037] to-[#EB432F] text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Download size={18} />
            Export All
          </button>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="text-white" size={20} />
                </div>
                <TrendingUp
                  className="text-blue-500 opacity-20 group-hover:opacity-40 transition-opacity"
                  size={20}
                />
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Invoices</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-2" />
              ) : (
                <p className="text-[#030000] text-2xl">
                  {summary.totalInvoices}
                </p>
              )}
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-200 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <DollarSign className="text-white" size={20} />
                </div>
                <TrendingUp
                  className="text-green-500 opacity-20 group-hover:opacity-40 transition-opacity"
                  size={20}
                />
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Paid</p>
              {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-2" />
              ) : (
                <p className="text-[#030000] text-2xl">
                  {formatCurrency(summary.totalPaid)}
                </p>
              )}
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Calendar className="text-white" size={20} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Last Payment</p>
              {isLoading ? (
                <div className="h-7 w-28 bg-gray-200 rounded animate-pulse mt-2" />
              ) : (
                <p className="text-[#030000] text-xl">
                  {summary.lastPayment
                    ? formatDate(summary.lastPayment)
                    : "N/A"}
                </p>
              )}
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EF8037] to-[#EB432F] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle className="text-white" size={20} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Payment Status</p>
              {isLoading ? (
                <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2" />
              ) : (
                <div
                  className={`text-xl flex items-center gap-1 ${summary.allPaid ? "text-green-600" : "text-yellow-600"
                    }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${summary.allPaid ? "bg-green-500" : "bg-yellow-500"
                      } animate-pulse`}
                  ></div>
                  <span>{summary.allPaid ? "All Paid" : "Some Pending"}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters & Search - Enhanced */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search invoices by ID, amount, or date..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <button className="px-6 py-3.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all flex items-center gap-2 border border-gray-200">
              <Filter size={18} />
              More Filters
            </button>
          </div>
        </div>

        {/* Invoices Cards - Modern Card Design Instead of Table */}
        {isLoading ? (
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-gray-200" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-32 bg-gray-200 rounded" />
                        <div className="h-5 w-20 bg-gray-200 rounded-full" />
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-4 w-4 bg-gray-200 rounded-full" />
                        <div className="h-4 w-32 bg-gray-200 rounded" />
                        <div className="h-4 w-4 bg-gray-200 rounded-full" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right space-y-2">
                      <div className="h-3 w-20 bg-gray-200 rounded ml-auto" />
                      <div className="h-8 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="w-40 h-12 bg-gray-200 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-[#030000] text-xl mb-2">No Invoices Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== "all"
                ? "No invoices match your search criteria."
                : "You don't have any invoices yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#030000]">Recent Invoices</h2>
              <p className="text-gray-600 text-sm">
                {summary.totalInvoices} total invoices
              </p>
            </div>

            {filteredInvoices.map((invoice: any) => (
              <div
                key={invoice._id}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#EF8037]/30 transition-all relative overflow-hidden"
              >
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#EF8037]/5 to-[#EB432F]/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>

                <div className="relative flex items-center justify-between">
                  {/* Left Section - Invoice Info */}
                  <div className="flex items-center gap-6 flex-1">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EF8037]/20 to-[#EB432F]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="text-[#EF8037]" size={24} />
                    </div>

                    {/* Invoice Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-[#030000] group-hover:text-[#EF8037] transition-colors">
                          {invoice.invoiceNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(
                            invoice.paymentStatus
                          )}`}
                        >
                          <CheckCircle size={12} />
                          {getStatusLabel(invoice.paymentStatus)}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-2">
                          <Calendar size={14} />
                          {formatDate(invoice.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{getTypeLabel(invoice.type)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-2">
                          <CreditCard size={14} />
                          {formatPaymentMethod(invoice.paymentMethod)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Amount & Actions */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-gray-600 text-sm mb-1">
                        {invoice.paymentStatus === "completed"
                          ? "Amount Paid"
                          : "Amount Due"}
                      </p>
                      <p className="text-[#030000] text-2xl">
                        {formatCurrency(
                          invoice.paymentStatus === "completed"
                            ? invoice.total
                            : invoice.subtotal,
                          invoice.currency
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownloadPDF(invoice)}
                      disabled={downloadingId === invoice._id}
                      className="group/btn px-6 py-3 bg-gradient-to-r from-[#EF8037] to-[#EB432F] text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all flex items-center gap-2 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700"></div>
                      {downloadingId === invoice._id ? (
                        <Loader2
                          size={16}
                          className="relative z-10 animate-spin"
                        />
                      ) : (
                        <Download size={16} className="relative z-10" />
                      )}
                      <span className="relative z-10">Download PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Billing Information - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <h3 className="text-[#030000]">Billing Information</h3>
              </div>

              <div className="space-y-4 mb-6">
                {isLoading ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl animate-pulse">
                      <div className="h-4 w-12 bg-gray-200 rounded" />
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl animate-pulse">
                      <div className="h-4 w-12 bg-gray-200 rounded" />
                      <div className="h-4 w-48 bg-gray-200 rounded" />
                    </div>
                  </>
                ) : invoices.length > 0 && (
                  <>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Name</span>
                      <span className="text-[#030000]">
                        {invoices[0].customerName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Email</span>
                      <span className="text-[#030000]">
                        {invoices[0].customerEmail}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <button className="w-full py-3.5 border-2 border-gray-200 text-[#030000] rounded-xl hover:border-[#EF8037] hover:bg-orange-50 transition-all flex items-center justify-center gap-2 group">
                <span>Update Billing Info</span>
                <ChevronRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <CreditCard className="text-white" size={20} />
                </div>
                <h3 className="text-[#030000]">Payment Method</h3>
              </div>

              {isLoading ? (
                <div className="p-5 border-2 border-gray-200 rounded-xl mb-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-24 bg-gray-200 rounded" />
                      <div className="h-4 w-40 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ) : invoices.length > 0 && invoices[0].paymentMethod && (
                <div className="p-5 border-2 border-gray-200 rounded-xl mb-6 hover:border-purple-300 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl">💳</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[#030000] mb-1">
                        {formatPaymentMethod(invoices[0].paymentMethod)}
                      </p>
                      {invoices[0].paymentDetails?.payerEmail && (
                        <p className="text-gray-600 text-sm">
                          {invoices[0].paymentDetails.payerEmail}
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1">
                      <CheckCircle size={14} />
                      Default
                    </span>
                  </div>
                </div>
              )}

              <button className="w-full py-3.5 border-2 border-gray-200 text-[#030000] rounded-xl hover:border-[#EF8037] hover:bg-orange-50 transition-all flex items-center justify-center gap-2 group">
                <span>Update Payment Method</span>
                <ChevronRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
