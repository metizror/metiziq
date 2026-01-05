'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginPage } from '../components/LoginPage';
import { SuperAdminDashboard } from '../components/SuperAdminDashboard';
import { AdminDashboard } from '../components/AdminDashboard';
import CustomerDashboard from '../components/CustomerDashboard';
import { Toaster } from '../components/ui/sonner';
import { useAppSelector } from '@/store/hooks';
import { initializeAuth } from '@/store/slices/auth.slice';
import { useAppDispatch } from '@/store/hooks';

export type UserRole = 'superadmin' | 'admin' | 'customer' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Contact {
  id: string;
  companyId?: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  jobLevel: string;
  jobRole: string;
  email: string;
  phone: string;
  directPhone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website: string;
  industry: string;
  contactLinkedIn: string;
  amfNotes: string;
  lastUpdateDate: string;
  addedBy: string;
  addedByRole: string;
  addedDate: string;
  updatedDate: string;
  // Required Company Fields
  companyName?: string;
  employeeSize?: string;
  revenue?: string;
}

export interface Company {
  id: string;
  companyName: string;
  phone?: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website: string;
  revenue: string;
  employeeSize: string;
  industry: string;
  technology: string;
  companyLinkedInUrl?: string;
  amfNotes: string;
  lastUpdateDate: string;
  addedBy: string;
  addedByRole: string;
  addedDate: string;
  updatedDate: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  user: string;
  role: string;
  timestamp: string;
}

export interface ApprovalRequest {
  id: string;
  firstName: string;
  lastName: string;
  businessEmail: string;
  companyName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export default function Page() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, isInitializing, token } = useAppSelector((state) => state.auth);
  const [currentUser, setCurrentUser] = useState(null as User | null);
  const [contacts, setContacts] = useState([] as Contact[]);
  const [companies, setCompanies] = useState([] as Company[]);
  const [users, setUsers] = useState([] as User[]);
  const [activityLogs, setActivityLogs] = useState([] as ActivityLog[]);
  const [approvalRequests, setApprovalRequests] = useState([] as ApprovalRequest[]);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isInitializing && !isLoading && isAuthenticated && user && token) {
      // Redirect based on role
      if (user.role === 'superadmin' || user.role === 'admin') {
        router.push('/dashboard');
      } else if (user.role === 'customer') {
        // Customers are redirected to /dashboard where the layout will handle routing
        router.push('/dashboard');
      }
    }
  }, [isInitializing, isLoading, isAuthenticated, user, token, router]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Mock data initialization removed - app now uses Redux for state management
    // Users are redirected to their dashboards which handle data fetching
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Show loading state while checking authentication
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting (the useEffect will handle the redirect)
  if (isAuthenticated && user && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated (regardless of currentUser state)
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage 
          onLogin={handleLogin} 
          onCreateApprovalRequest={(request) => {
            const approvalRequest: ApprovalRequest = {
              id: Date.now().toString(),
              firstName: request.firstName,
              lastName: request.lastName,
              businessEmail: request.businessEmail,
              companyName: request.companyName,
              status: 'pending',
              createdAt: new Date().toISOString()
            };
            setApprovalRequests([...approvalRequests, approvalRequest]);
          }}
        />
        <Toaster />
      </>
    );
  }
  
  // Legacy code path - should only be reached if currentUser is set but Redux auth is not
  // This is kept for backward compatibility but authenticated users should be redirected above
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {currentUser.role === 'superadmin' ? (
        <SuperAdminDashboard
          user={currentUser}
          contacts={contacts}
          companies={companies}
          users={users}
          activityLogs={activityLogs}
          approvalRequests={approvalRequests}
          setContacts={setContacts}
          setCompanies={setCompanies}
          setUsers={setUsers}
          setActivityLogs={setActivityLogs}
          setApprovalRequests={setApprovalRequests}
          onLogout={handleLogout}
        />
      ) : currentUser.role === 'admin' ? (
        <AdminDashboard
          user={currentUser}
          contacts={contacts}
          companies={companies}
          activityLogs={activityLogs}
          approvalRequests={approvalRequests}
          setContacts={setContacts}
          setCompanies={setCompanies}
          setActivityLogs={setActivityLogs}
          setApprovalRequests={setApprovalRequests}
          onLogout={handleLogout}
        />
      ) : currentUser.role === 'customer' ? (
        <CustomerDashboard onLogout={handleLogout} />
      ) : null}
      <Toaster />
    </div>
  );
}



