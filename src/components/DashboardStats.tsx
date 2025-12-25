import React from 'react';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Users, Building2, UserCheck, Upload, TrendingUp, Calendar } from 'lucide-react';
import type { Contact, Company, User } from '@/types/dashboard.types';

interface DashboardStatsProps {
  contacts: Contact[];
  companies: Company[];
  users: User[];
  role: 'superadmin' | 'admin';
  adminUsersCount?: number;
  lastImportDate?: string | null;
  isLoading?: {
    contacts?: boolean;
    companies?: boolean;
    users?: boolean;
    importDate?: boolean;
  };
}

export function DashboardStats({ contacts, companies, users, role, adminUsersCount, lastImportDate, isLoading }: DashboardStatsProps) {
  const today = new Date().toLocaleDateString();

  // Get counts from array lengths (arrays are created with count length)
  const contactsCount = contacts.length;
  const companiesCount = companies.length;
  const usersCount = adminUsersCount !== undefined ? adminUsersCount : users.length;

  console.log(usersCount, "usersCount");

  // Format last import date or show "No imports yet"
  const formattedLastImportDate = lastImportDate
    ? new Date(lastImportDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : 'No imports yet';

  const statsCards = role === 'superadmin' ? [
    {
      title: 'Total Contacts',
      value: contactsCount.toLocaleString(),
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      glowColor: 'rgba(59, 130, 246, 0.3)',
      iconBg: 'from-blue-100 to-cyan-100',
      label: 'Active contacts in database'
    },
    {
      title: 'Total Companies',
      value: companiesCount.toLocaleString(),
      icon: Building2,
      gradient: 'from-green-500 to-emerald-500',
      glowColor: 'rgba(34, 197, 94, 0.3)',
      iconBg: 'from-green-100 to-emerald-100',
      label: 'Registered companies'
    },
    {
      title: 'Total Users',
      value: usersCount.toLocaleString(),
      icon: UserCheck,
      gradient: 'from-purple-500 to-pink-500',
      glowColor: 'rgba(168, 85, 247, 0.3)',
      iconBg: 'from-purple-100 to-pink-100',
      label: 'Active system users'
    },
    {
      title: 'Last Import Date',
      value: formattedLastImportDate,
      icon: Upload,
      gradient: 'from-blue-500 to-indigo-500',
      glowColor: 'rgba(59, 130, 246, 0.3)',
      iconBg: 'from-blue-100 to-indigo-100',
      label: 'Most recent data import'
    }
  ] : [
    {
      title: 'Contacts Added',
      value: contactsCount.toLocaleString(),
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      glowColor: 'rgba(59, 130, 246, 0.3)',
      iconBg: 'from-blue-100 to-cyan-100',
      label: 'Added by you'
    },
    {
      title: 'Growth This Month',
      value: '+12%',
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-500',
      glowColor: 'rgba(168, 85, 247, 0.3)',
      iconBg: 'from-purple-100 to-pink-100',
      label: 'Monthly growth rate'
    },
    {
      title: 'Last Updated',
      value: today,
      icon: Calendar,
      gradient: 'from-blue-500 to-indigo-500',
      glowColor: 'rgba(59, 130, 246, 0.3)',
      iconBg: 'from-blue-100 to-indigo-100',
      label: 'Last activity date'
    }
  ];

  // Determine which cards are loading
  const getLoadingState = (index: number) => {
    if (role === 'superadmin') {
      if (index === 0) return isLoading?.contacts ?? false;
      if (index === 1) return isLoading?.companies ?? false;
      if (index === 2) return isLoading?.users ?? false;
      if (index === 3) return isLoading?.importDate ?? false;
    } else {
      // For admin role:
      // Card 0: Contacts Added
      // Cards 1 and 2 (Growth, Last Updated) show skeleton when any data is loading
      if (index === 0) return isLoading?.contacts ?? false;
      // For Growth This Month and Last Updated cards, show skeleton when dashboard data is loading
      if (index === 1) return isLoading?.contacts ?? false; // Use contacts loading as indicator
      if (index === 2) return isLoading?.contacts ?? false; // Use contacts loading as indicator
    }
    return false;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        const isCardLoading = getLoadingState(index);

        return (
          <Card
            key={index}
            className="relative overflow-hidden border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            {/* Gradient Glow Effect */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ backgroundColor: stat.glowColor }}
            />

            {/* Top Gradient Border */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />

            <CardContent className="relative p-6">
              {isCardLoading ? (
                // Skeleton Loading State with shimmer animation
                <>
                  {/* Icon Badge Skeleton */}
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                  </div>

                  {/* Title Skeleton */}
                  <Skeleton className="h-4 w-24 mb-2" />

                  {/* Value Skeleton */}
                  <Skeleton className="h-9 w-16 mb-2" />

                  {/* Label Skeleton */}
                  <div className="flex items-center gap-1">
                    <Skeleton className="w-1.5 h-1.5 rounded-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </>
              ) : (
                // Actual Content
                <>
                  {/* Icon Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`relative p-3.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg transform group-hover:scale-110 transition-all duration-300`}>
                      <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />

                      {/* Icon Glow Effect */}
                      <div
                        className={`absolute inset-0 rounded-xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-60 blur-lg transition-opacity duration-300`}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {stat.title}
                  </h3>

                  {/* Value */}
                  <div className={`text-3xl font-semibold mb-2 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>

                  {/* Label */}
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${stat.gradient}`} />
                    {stat.label}
                  </p>
                </>
              )}
            </CardContent>

            {/* Bottom Subtle Gradient */}
            <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${stat.gradient} opacity-20`} />
          </Card>
        );
      })}
    </div>
  );
}
