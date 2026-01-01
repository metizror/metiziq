"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ViewCompanyDetails } from "@/components/ViewCompanyDetails";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { getCompanies } from "@/store/slices/companies.slice";
import { privateApiCall } from "@/lib/api";
import type { User } from "@/types/dashboard.types";
import { toast } from "sonner";

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.id as string;
  
  const { user } = useAppSelector((state) => state.auth);
  const { companies: reduxCompanies } = useAppSelector((state) => state.companies);
  const dispatch = useAppDispatch();
  const [company, setCompany] = useState(null as any | null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const hasFetchedRef = useRef(false);

  const dashboardUser: User | null = user ? {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
    role: user.role || null,
  } : null;

  useEffect(() => {
    const fetchCompany = async () => {
      // Guard against double-invocation (e.g., React strict mode) and identical calls
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      if (!companyId) {
        setError("Company ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // First, check if company is already in Redux store
        let companyData: any = reduxCompanies.find((c: any) => {
          const cId = (c as any)._id?.toString() || c.id?.toString();
          return cId === companyId;
        });
        
        // If not found in Redux, fetch directly by id to avoid pagination loops
        if (!companyData) {
          const response = await privateApiCall<{ company: any }>(`/admin/companies?id=${companyId}`);
          companyData = response.company;
        }
        
        if (!companyData) {
          setError('Company not found');
          toast.error('Company not found');
          setIsLoading(false);
          return;
        }
        
        // Map the API response to Company type
        const mappedCompany: any = {
          id: companyData._id?.toString() || companyData.id,
          companyName: companyData.companyName || '',
          allDetails: companyData.allDetails || {},
          createdBy: companyData.createdBy || companyData.addedBy || undefined,
          uploaderId: companyData.uploaderId || undefined,
          createdAt: companyData.createdAt || '',
          updatedAt: companyData.updatedAt || '',
        };

        setCompany(mappedCompany);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch company';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  // Only depend on companyId to avoid re-fetch loops when Redux store updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleBack = () => {
    router.push('/companies');
  };

  const handleCompanyUpdated = async () => {
    // Refresh company data after update
    if (!companyId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
       // Fetch updated company from API without pagination loops
       const response = await privateApiCall<any>(`/admin/companies?id=${companyId}`);
       const companyData = response?.company || response;
      
      if (companyData) {
        const mappedCompany: any = {
          id: companyData._id?.toString() || companyData.id,
          companyName: companyData.companyName || '',
          allDetails: companyData.allDetails || {},
          createdBy: companyData.createdBy || companyData.addedBy || undefined,
          createdAt: companyData.createdAt || '',
          updatedAt: companyData.updatedAt || '',
        };
        setCompany(mappedCompany);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to refresh company';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExport = (company: any) => {
    const companyData = company as any;
    const csvHeader = 'Company ID,Company Name,Phone,Address 1,Address 2,City,State,Zip Code,Country,Website,Revenue,Employee Size,Industry,Sub-Industry,Technology,Company LinkedIn URL,aMF Notes,Created By,Added Date,Last Update Date,Updated Date';
    const csvRow = [
      escapeCSV(company.id || companyData._id || ''),
      escapeCSV(company.companyName || ''),
      escapeCSV(company.allDetails?.phone || ''),
      escapeCSV(company.address1 || ''),
      escapeCSV(company.address2 || ''),
      escapeCSV(company.city || ''),
      escapeCSV(company.state || ''),
      escapeCSV(company.zipCode || ''),
      escapeCSV(company.country || ''),
      escapeCSV(company.website || ''),
      escapeCSV(company.revenue || ''),
      escapeCSV(company.employeeSize || ''),
      escapeCSV(company.industry || ''),
      escapeCSV(companyData.subIndustry || ''),
      escapeCSV(company.technology || ''),
      escapeCSV(company.companyLinkedInUrl || ''),
      escapeCSV(company.amfNotes || ''),
      escapeCSV(companyData.createdBy || company.addedBy || ''),
      escapeCSV(company.addedDate || companyData.createdAt || ''),
      escapeCSV(company.lastUpdateDate || ''),
      escapeCSV(company.updatedDate || companyData.updatedAt || '')
    ].join(',');
    
    const csvContent = [csvHeader, csvRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `company-${company.companyName.replace(/\s+/g, '-').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!dashboardUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Company not found'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Back to Companies
          </button>
        </div>
      </div>
    );
  }

  return (
    <ViewCompanyDetails
      company={company}
      user={dashboardUser}
      onBack={handleBack}
      onExport={handleExport}
      onCompanyUpdated={handleCompanyUpdated}
    />
  );
}

