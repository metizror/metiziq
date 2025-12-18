import React, { useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardStats } from './DashboardStats';
import { ContactsTable } from './ContactsTable';
import { CompaniesTable } from './CompaniesTable';
import { ActivityLogsPanel } from './ActivityLogsPanel';
import { SettingsPanel } from './SettingsPanel';
import { FilterPanel } from './FilterPanel';
import { ViewCompanyDetails } from './ViewCompanyDetails';
import { ViewContactDetails } from './ViewContactDetails';
import { Button } from './ui/button';
import { LogOut, Filter } from 'lucide-react';
import { ApprovalRequests } from './ApprovalRequests';
import type { User, Contact, Company, ActivityLog, ApprovalRequest } from '@/types/dashboard.types';

interface AdminDashboardProps {
  user: User;
  contacts: Contact[];
  companies: Company[];
  activityLogs: ActivityLog[];
  approvalRequests: ApprovalRequest[];
  setContacts: (contacts: Contact[]) => void;
  setCompanies: (companies: Company[]) => void;
  setActivityLogs: (logs: ActivityLog[]) => void;
  setApprovalRequests: (requests: ApprovalRequest[]) => void;
  onLogout: () => void;
}

type ViewType = 'dashboard' | 'contacts' | 'companies' | 'customers' | 'users' | 'activity' | 'settings' | 'view-company' | 'view-contact';

export function AdminDashboard({
  user,
  contacts,
  companies,
  activityLogs,
  approvalRequests,
  setContacts,
  setCompanies,
  setActivityLogs,
  setApprovalRequests,
  onLogout
}: AdminDashboardProps) {
  const [activeView, setActiveView] = useState('dashboard' as ViewType);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedCompany, setSelectedCompany] = useState(null as Company | null);
  const [selectedContact, setSelectedContact] = useState(null as Contact | null);

  const pendingRequestsCount = approvalRequests.filter((req: ApprovalRequest) => req.status === 'pending').length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'contacts', label: 'Contacts', icon: 'Users' },
    { id: 'companies', label: 'Companies', icon: 'Building2' },
    {
      id: 'customers',
      label: 'Customers',
      icon: 'CheckCircle2',
      ...(pendingRequestsCount > 0 && { badge: pendingRequestsCount })
    },
    { id: 'users', label: 'Users', icon: 'UserCheck' },
    { id: 'activity', label: 'Activity Logs', icon: 'Activity' },
    { id: 'settings', label: 'Settings', icon: 'Settings' }
  ];

  // Filter data to show only items added/updated by this admin
  const userContacts = contacts.filter(contact => contact.addedBy === user.name);
  const userCompanies = companies.filter(company => company.addedBy === user.name);
  const userLogs = activityLogs.filter(log => log.user === user.name);

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setActiveView('view-company');
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setActiveView('companies');
  };

  const handleEditCompany = (company: Company) => {
    // Navigate back to companies view with edit dialog open
    // This will be handled by the CompaniesTable component
    setSelectedCompany(null);
    setActiveView('companies');
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanies(companies.filter(c => c.id !== companyId));
    setSelectedCompany(null);
    setActiveView('companies');
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setActiveView('view-contact');
  };

  const handleBackToContacts = () => {
    setSelectedContact(null);
    setActiveView('contacts');
  };

  const handleEditContact = (contact: Contact) => {
    // Navigate back to contacts view with edit dialog open
    // This will be handled by the ContactsTable component
    setSelectedContact(null);
    setActiveView('contacts');
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(contacts.filter(c => c.id !== contactId));
    setSelectedContact(null);
    setActiveView('contacts');
  };

  const handleExportContact = (contact: Contact) => {
    const csvHeader = 'First Name,Last Name,Job Title,Job Level,Job Role,Email,Phone,Direct Phone,Address 1,Address 2,City,State,Zip Code,Country,Website,Industry,Contact LinkedIn URL,aMF Notes,Last Update Date';
    const csvRow = `"${contact.firstName}","${contact.lastName}","${contact.jobTitle}","${contact.jobLevel}","${contact.jobRole}","${contact.email}","${contact.phone}","${contact.directPhone}","${contact.address1}","${contact.address2}","${contact.city}","${contact.state}","${contact.zipCode}","${contact.country}","${contact.website}","${contact.industry}","${contact.contactLinkedInUrl}","${contact.amfNotes}","${contact.lastUpdateDate}"`;

    const csvContent = [csvHeader, csvRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-${contact.firstName}-${contact.lastName}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardStats
              contacts={userContacts}
              companies={userCompanies}
              users={[]} // Admins don't see user stats
              role="admin"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => setActiveView('contacts')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    Manage Contacts
                  </Button>
                  <Button
                    onClick={() => setActiveView('companies')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    Manage Companies
                  </Button>
                </div>
              </div>
              <ActivityLogsPanel logs={userLogs.slice(0, 5)} pagination={null} />
            </div>
          </div>
        );
      case 'contacts':
        return <ContactsTable contacts={userContacts} user={user} companies={userCompanies} filters={filters} onViewContact={handleViewContact} />;
      case 'companies':
        return <CompaniesTable companies={userCompanies} user={user} filters={filters} onViewCompany={handleViewCompany} />;
      case 'view-company':
        return selectedCompany ? (
          <ViewCompanyDetails
            company={selectedCompany}
            user={user}
            onBack={handleBackToCompanies}
            onExport={(company) => {
              // Handle export
              console.log('Export company', company);
            }}
          />
        ) : null;
      case 'view-contact':
        return selectedContact ? (
          <ViewContactDetails
            contact={selectedContact}
            user={user}
            onBack={handleBackToContacts}
            onEdit={handleEditContact}
            onDelete={handleDeleteContact}
            onExport={handleExportContact}
            companyName={selectedContact.companyId ? companies.find(c => c.id === selectedContact.companyId)?.companyName : undefined}
            company={selectedContact.companyId ? companies.find(c => c.id === selectedContact.companyId) : undefined}
          />
        ) : null;
      case 'users':
        return (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">User Management</h3>
            <p className="text-gray-600">Access restricted. Contact Owner for user management.</p>
          </div>
        );
      case 'customers':
        return (
          <ApprovalRequests
            approvalRequests={approvalRequests}
            setApprovalRequests={setApprovalRequests}
            currentUser={{ name: user.name, role: user.role || '' }}
            onApprove={(request) => {
              // Add activity log when approving
              const newLog: ActivityLog = {
                id: Date.now().toString(),
                action: 'Customer Approved',
                details: `Approved customer registration for ${request.firstName} ${request.lastName} (${request.businessEmail})`,
                user: user.name,
                role: user.role || '',
                timestamp: new Date().toISOString()
              };
              setActivityLogs([newLog, ...activityLogs]);
            }}
          />
        );
      case 'activity':
        return <ActivityLogsPanel logs={userLogs} pagination={null} />;
      case 'settings':
        return <SettingsPanel user={user} />;
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        activeView={activeView}
        menuItems={menuItems.map(item => ({ ...item, path: `/${item.id === 'dashboard' ? 'dashboard' : item.id}` }))}
        user={{
          _id: user.id,
          email: user.email,
          name: user.name,
          role: (user.role || 'admin') as 'admin' | 'superadmin' | 'customer',
        }}
        onLogout={onLogout}
        pendingRequestsCount={pendingRequestsCount}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {activeView !== 'view-company' && activeView !== 'view-contact' && (
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-semibold text-gray-900 capitalize">
                  {activeView === 'dashboard' ? 'Admin Dashboard' : activeView === 'customers' ? 'Customers' : activeView}
                </h1>
                {(activeView === 'contacts' || activeView === 'companies') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Search Filters
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Filter Panel */}
          {showFilters && (activeView === 'contacts' || activeView === 'companies') && (
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              onClose={() => setShowFilters(false)}
            />
          )}

          {/* Main Content */}
          <main className={`flex-1 overflow-auto relative ${activeView === 'view-company' || activeView === 'view-contact' ? '' : 'p-6'}`}>
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Top Right Gradient Orb */}
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-orange-200/30 via-orange-100/20 to-transparent rounded-full blur-3xl"></div>

              {/* Bottom Left Gradient Orb */}
              <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-200/20 via-purple-100/20 to-transparent rounded-full blur-3xl"></div>

              {/* Subtle Grid Pattern */}
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}></div>

              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-400/30 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10">
              {renderMainContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}