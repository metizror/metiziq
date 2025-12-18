"use client";

import { useRouter } from "next/navigation";
import CustomerDashboardHome from "@/components/CustomerDashboardHome";
import { useAppSelector } from "@/store/hooks";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  // Get user data from Redux
  const userName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Customer';

  const setActiveTab = (tab: string) => {
    // Map old tab names to new routes
    const routeMap: Record<string, string> = {
      'search-contacts': '/customer/contacts',
      'search-companies': '/customer/companies',
      'downloads': '/customer/downloads',
      'invoices': '/customer/invoices',
      'settings': '/customer/settings',
    };
    
    if (routeMap[tab]) {
      router.push(routeMap[tab]);
  }
  };

  return <CustomerDashboardHome userName={userName} setActiveTab={setActiveTab} />;
}










