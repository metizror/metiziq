import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import CustomerSidebar from './CustomerSidebar';
import CustomerDashboardHome from './CustomerDashboardHome';
import CustomerSearchContacts from './CustomerSearchContacts';
import CustomerSearchCompanies from './CustomerSearchCompanies';
import CustomerDownloads from './CustomerDownloads';
import CustomerAllDownloads from './CustomerAllDownloads';
import CustomerPayment from './CustomerPayment';
import CustomerInvoices from './CustomerInvoices';
import CustomerSettings from './CustomerSettings';
import { SupportContactForm } from './SupportContactForm';
import { useAppSelector } from '@/store/hooks';

interface CustomerDashboardProps {
  onLogout: () => void;
}

export default function CustomerDashboard({ onLogout }: CustomerDashboardProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  // Get user data from Redux
  const userName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Customer';
  const userEmail = user?.email || '';
  const isPaid = false; // Set to false to show paywall features - can be updated based on user subscription status

  // Listen for hash changes for deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'all-downloads') {
        setActiveTab('all-downloads');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleBackToDownloads = () => {
    window.location.hash = '';
    setActiveTab('downloads');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <CustomerSidebar
        pathname={pathname}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onSupportClick={() => setShowSupportModal(true)}
        onLogout={onLogout}
      />

      {activeTab === 'dashboard' && (
        <CustomerDashboardHome userName={userName} setActiveTab={setActiveTab} />
      )}
      {activeTab === 'search-contacts' && (
        <CustomerSearchContacts isPaid={isPaid} setActiveTab={setActiveTab} />
      )}
      {activeTab === 'search-companies' && (
        <CustomerSearchCompanies isPaid={isPaid} setActiveTab={setActiveTab} />
      )}
      {activeTab === 'downloads' && <CustomerDownloads />}
      {activeTab === 'all-downloads' && <CustomerAllDownloads onBack={handleBackToDownloads} />}
      {activeTab === 'payment' && <CustomerPayment setActiveTab={setActiveTab} />}
      {activeTab === 'invoices' && <CustomerInvoices />}
      {activeTab === 'settings' && <CustomerSettings />}

      {/* Support Modal */}
      <SupportContactForm
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        userEmail={userEmail}
        userName={userName}
      />
    </div>
  );
}
