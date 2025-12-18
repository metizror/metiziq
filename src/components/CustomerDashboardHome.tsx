"use client";

import React, { useEffect, useState } from 'react';
import { Users, Download, CreditCard, Calendar, TrendingUp, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { privateApiCall } from '@/lib/api';
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerDashboardHomeProps {
  userName: string;
  setActiveTab: (tab: string) => void;
}

interface DownloadsSummaryResponse {
  summary: {
    totalDownloads: number;
    totalContacts: number;
    lastDownload: Date | string | null;
  };
}

interface InvoicesSummaryResponse {
  summary: {
    totalInvoices: number;
    totalPaid: number;
    lastPayment: Date | string | null;
    allPaid: boolean;
  };
}
interface ActivityLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

interface ActivitiesResponse {
  activities: ActivityLog[];
}

// ... existing code ...

export default function CustomerDashboardHome({ userName, setActiveTab }: CustomerDashboardHomeProps) {
  const router = useRouter();

  const [totalContactsDownloaded, setTotalContactsDownloaded] = useState(0);
  const [totalDownloadsCount, setTotalDownloadsCount] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [lastInvoiceDate, setLastInvoiceDate] = useState('N/A');
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [recentActivities, setRecentActivities] = useState([] as ActivityLog[]);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoadingStats(true);

        const [downloadsRes, invoicesRes, activitiesRes] = await Promise.all([
          privateApiCall('/customers/downloads?limit=1') as Promise<DownloadsSummaryResponse>,
          privateApiCall('/customers/payment/invoices?limit=1') as Promise<InvoicesSummaryResponse>,
          privateApiCall('/customers/activity-logs') as Promise<ActivitiesResponse>,
        ]);

        if (downloadsRes?.summary) {
          setTotalContactsDownloaded(downloadsRes.summary.totalContacts || 0);
          setTotalDownloadsCount(downloadsRes.summary.totalDownloads || 0);
        }

        if (invoicesRes?.summary) {
          setLastInvoiceDate(formatDate(invoicesRes.summary.lastPayment));
          setTotalPaid(invoicesRes.summary.totalPaid || 0);
        }

        if (activitiesRes?.activities) {
          setRecentActivities(activitiesRes.activities);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    }

    fetchStats();
  }, []);

  // Helper function to get icon for activity
  const getActivityIcon = (action: string) => {
    if (action.toLowerCase().includes('download')) return Download;
    if (action.toLowerCase().includes('payment')) return CreditCard;
    if (action.toLowerCase().includes('invoice')) return Calendar;
    return TrendingUp;
  };

  // Helper function to calculate time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  // Helper function to format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = [
    {
      title: 'Contacts Downloaded',
      value: totalContactsDownloaded.toLocaleString(),
      icon: Download,
      gradient: 'from-green-500 to-emerald-500' // Green from image
    },
    {
      title: 'Payment Status',
      value: 'Active', // Hardcoded as per image for now, logic can be added later
      icon: CreditCard,
      gradient: 'from-orange-500 to-red-500' // Orange from image
    },
    {
      title: 'Last Invoice Date',
      value: lastInvoiceDate,
      icon: Calendar,
      gradient: 'from-purple-500 to-pink-500' // Purple from image
    }
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Welcome back, {userName}! <span className="text-2xl">👋</span>
            </h1>
            <p className="text-gray-500 mt-1">Here's what's happening with your account today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('search-contacts')}
              className="bg-[#2563EB] hover:bg-[#D66826] text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-orange-200"
            >
              Search Contacts
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Make Payment
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Stats Grid - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* ... stats map ... */}
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 relative overflow-hidden cursor-pointer"
                style={{
                  animation: `slideUp 0.4s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                {/* Decorative Circle */}
                <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                      <Icon className="text-white" size={24} />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <TrendingUp className="text-green-500" size={18} />
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-2">{stat.title}</p>
                  <div className="text-[#030000] text-2xl group-hover:text-3xl transition-all duration-300">{stat.value}</div>

                  {/* Progress Bar */}
                  <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-700 group-hover:w-full`}
                      style={{ width: '60%' }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - Enhanced */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-full blur-3xl"></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#EB432F] flex itemsCenter justify-center shadow-lg">
                    <TrendingUp className="text-white" size={20} />
                  </div>
                  <h2 className="text-[#030000]">Recent Activity</h2>
                </div>
                <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs">
                  Live
                </div>
              </div>

              <div className="space-y-3">
                {isLoadingStats ? (
                  // Skeleton loading state
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No recent activity found.
                  </div>
                ) : (
                  recentActivities.map((activity: ActivityLog, index: number) => {
                    const Icon = getActivityIcon(activity.action);
                    return (
                      <div
                        key={activity.id}
                        className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 transition-all duration-300 border border-transparent hover:border-orange-200"
                        style={{
                          animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-orange-100 group-hover:to-red-100 flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm group-hover:shadow-md">
                          <Icon className="text-gray-600 group-hover:text-[#2563EB] transition-colors duration-300" size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[#030000] mb-1 group-hover:text-[#2563EB] transition-colors duration-300 font-medium">
                            {activity.action}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">{activity.details}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock size={14} />
                              <span className="text-xs">{getTimeAgo(activity.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions - Enhanced */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-2xl"></div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-[#030000]">Quick Actions</h2>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('search-contacts')}
                  className="group w-full px-5 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-[#030000] rounded-xl transition-all duration-300 text-left border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg hover:scale-105 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                      <Users className="text-white" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Contact Search</p>
                      <p className="text-xs text-gray-600">Find contacts instantly</p>
                    </div>
                    <svg className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('downloads')}
                  className="group w-full px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-[#030000] rounded-xl transition-all duration-300 text-left border-2 border-green-100 hover:border-green-300 hover:shadow-lg hover:scale-105 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                      <Download className="text-white" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">My Downloads</p>
                      <p className="text-xs text-gray-600">Access your files</p>
                    </div>
                    <svg className="w-5 h-5 text-green-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('payment')}
                  className="group w-full px-5 py-4 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 text-[#030000] rounded-xl transition-all duration-300 text-left border-2 border-orange-100 hover:border-orange-300 hover:shadow-lg hover:scale-105 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#EB432F] flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                      <CreditCard className="text-white" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Make Payment</p>
                      <p className="text-xs text-gray-600">Manage billing</p>
                    </div>
                    <svg className="w-5 h-5 text-[#2563EB] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('invoices')}
                  className="group w-full px-5 py-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-[#030000] rounded-xl transition-all duration-300 text-left border-2 border-purple-100 hover:border-purple-300 hover:shadow-lg hover:scale-105 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                      <Calendar className="text-white" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Invoices</p>
                      <p className="text-xs text-gray-600">View history</p>
                    </div>
                    <svg className="w-5 h-5 text-purple-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
