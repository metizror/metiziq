"use client";

import { useRouter } from "next/navigation";
import CustomerSearchContacts from "@/components/CustomerSearchContacts";

export default function CustomerContactsPage() {
  const router = useRouter();
  const isPaid = false; // Set to false to show paywall features - can be updated based on user subscription status

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

  return <CustomerSearchContacts isPaid={isPaid} setActiveTab={setActiveTab} />;
}

