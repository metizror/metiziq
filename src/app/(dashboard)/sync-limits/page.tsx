"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { privateApiCall } from "@/lib/api";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";

export default function SyncLimitsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [syncLimit, setSyncLimit] = useState(null as {
    userId: string;
    userName: string;
    userEmail: string;
    monthlyLimit: number;
    currentMonthCount: number;
    remainingSyncs: number;
    lastResetDate: string | null;
  } | null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSyncLimit = async () => {
      try {
        setIsLoading(true);
        const response = await privateApiCall<{ limit: any }>('/admin/sync-limits');
        if (response.limit) {
          setSyncLimit({
            userId: response.limit.userId,
            userName: response.limit.userName || user?.name || 'Unknown',
            userEmail: response.limit.userEmail || user?.email || 'Unknown',
            monthlyLimit: response.limit.monthlyLimit || 0,
            currentMonthCount: response.limit.currentMonthCount || 0,
            remainingSyncs: response.limit.remainingSyncs || 0,
            lastResetDate: response.limit.lastResetDate || null,
          });
        }
      } catch (error: any) {
        console.error('Failed to fetch sync limit:', error);
        toast.error('Failed to load sync limit information');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role !== 'superadmin') {
      fetchSyncLimit();
    } else if (user?.role === 'superadmin') {
      // Superadmin has unlimited syncs
      setSyncLimit({
        userId: user.id || '',
        userName: user.name || 'Owner',
        userEmail: user.email || '',
        monthlyLimit: -1,
        currentMonthCount: 0,
        remainingSyncs: -1,
        lastResetDate: null,
      });
      setIsLoading(false);
    }
  }, [user]);

  const handleRefresh = async () => {
    if (user?.role === 'superadmin') return;
    
    try {
      setIsLoading(true);
      const response = await privateApiCall<{ limit: any }>('/admin/sync-limits');
      if (response.limit) {
        setSyncLimit({
          userId: response.limit.userId,
          userName: response.limit.userName || user?.name || 'Unknown',
          userEmail: response.limit.userEmail || user?.email || 'Unknown',
          monthlyLimit: response.limit.monthlyLimit || 0,
          currentMonthCount: response.limit.currentMonthCount || 0,
          remainingSyncs: response.limit.remainingSyncs || 0,
          lastResetDate: response.limit.lastResetDate || null,
        });
        toast.success('Sync limit information refreshed');
      }
    } catch (error: any) {
      console.error('Failed to refresh sync limit:', error);
      toast.error('Failed to refresh sync limit');
    } finally {
      setIsLoading(false);
    }
  };

  const getNextResetDate = () => {
    if (!syncLimit?.lastResetDate) return null;
    const lastReset = new Date(syncLimit.lastResetDate);
    const nextReset = new Date(lastReset);
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1); // First day of next month
    return nextReset;
  };

  const getDaysUntilReset = () => {
    const nextReset = getNextResetDate();
    if (!nextReset) return null;
    const now = new Date();
    const diffTime = nextReset.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sync Limits</h1>
            <p className="text-gray-600 mt-1">Monitor your LinkedIn sync usage and remaining limits</p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading || user?.role === 'superadmin'}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Remaining Syncs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Remaining Syncs</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {user?.role === 'superadmin' ? (
                <div className="text-3xl font-bold text-green-600">Unlimited</div>
              ) : syncLimit?.remainingSyncs === 0 ? (
                <div className="text-3xl font-bold text-red-600">0</div>
              ) : (
                <div className="text-3xl font-bold text-green-600">{syncLimit?.remainingSyncs || 0}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {user?.role === 'superadmin' 
                  ? 'No restrictions for owner'
                  : syncLimit?.remainingSyncs === 0
                    ? 'Limit reached for this month'
                    : 'Available for this month'
                }
              </p>
            </CardContent>
          </Card>

          {/* Monthly Limit */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Limit</CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {user?.role === 'superadmin' ? (
                <div className="text-3xl font-bold text-gray-600">Unlimited</div>
              ) : (
                <div className="text-3xl font-bold text-gray-900">{syncLimit?.monthlyLimit || 0}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {user?.role === 'superadmin' 
                  ? 'No monthly restrictions'
                  : syncLimit?.monthlyLimit === 0
                    ? 'Limit not set by owner'
                    : 'Syncs allowed per month'
                }
              </p>
            </CardContent>
          </Card>

          {/* Current Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Used This Month</CardTitle>
              <AlertCircle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {user?.role === 'superadmin' ? (
                <div className="text-3xl font-bold text-gray-600">-</div>
              ) : (
                <div className={`text-3xl font-bold ${syncLimit && syncLimit.currentMonthCount >= syncLimit.monthlyLimit ? 'text-red-600' : 'text-gray-900'}`}>
                  {syncLimit?.currentMonthCount || 0}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {user?.role === 'superadmin' 
                  ? 'Not applicable'
                  : syncLimit && syncLimit.monthlyLimit > 0
                    ? `of ${syncLimit.monthlyLimit} syncs used`
                    : 'No limit set'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Limit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === 'superadmin' ? (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Unlimited Access</p>
                  <p className="text-sm text-blue-700">As the owner, you have unlimited LinkedIn sync access with no restrictions.</p>
                </div>
              </div>
            ) : syncLimit?.monthlyLimit === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">No Sync Limit Set</p>
                  <p className="text-sm text-yellow-700">Please contact the owner to set your monthly sync limit.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">User Information</p>
                    <p className="font-medium text-gray-900">{syncLimit?.userName}</p>
                    <p className="text-sm text-gray-600">{syncLimit?.userEmail}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Last Reset Date</p>
                    <p className="font-medium text-gray-900">
                      {syncLimit?.lastResetDate 
                        ? new Date(syncLimit.lastResetDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'Not available'
                      }
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {syncLimit && syncLimit.monthlyLimit > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Monthly Usage</span>
                      <span className="font-medium text-gray-900">
                        {syncLimit.currentMonthCount} / {syncLimit.monthlyLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          syncLimit.currentMonthCount >= syncLimit.monthlyLimit
                            ? 'bg-red-500'
                            : syncLimit.currentMonthCount >= syncLimit.monthlyLimit * 0.8
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (syncLimit.currentMonthCount / syncLimit.monthlyLimit) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Next Reset Information */}
                {syncLimit && syncLimit.monthlyLimit > 0 && getNextResetDate() && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <p className="font-medium text-blue-900">Next Reset Date</p>
                    </div>
                    <p className="text-sm text-blue-700">
                      Your sync count will reset on{' '}
                      <span className="font-medium">
                        {getNextResetDate()?.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                      {getDaysUntilReset() !== null && (
                        <span className="ml-2">
                          ({getDaysUntilReset()} {getDaysUntilReset() === 1 ? 'day' : 'days'} remaining)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Warning if limit reached */}
                {syncLimit && syncLimit.remainingSyncs === 0 && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="font-medium text-red-900">Monthly Limit Reached</p>
                    </div>
                    <p className="text-sm text-red-700">
                      You have used all {syncLimit.monthlyLimit} syncs for this month. Your limit will reset on{' '}
                      {getNextResetDate()?.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

