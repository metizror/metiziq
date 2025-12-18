import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Filter, Download, Eye, Lock, AlertCircle, ChevronDown, CreditCard, X, Upload, FileSpreadsheet } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { getCustomerContacts, type GetCustomerContactsParams } from '@/store/slices/customerContacts.slice';
import { updateUser } from '@/store/slices/auth.slice';
import { privateApiCall } from '@/lib/api';
import { Skeleton } from './ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { useCountries } from '@/hooks/useCountries';
import PayPalPayment from './PayPalPayment';

interface CustomerSearchContactsProps {
  isPaid: boolean;
  setActiveTab: (tab: string) => void;
}

export default function CustomerSearchContacts({ isPaid, setActiveTab }: CustomerSearchContactsProps) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { contacts, pagination, isLoading, isRefreshing, error, lastFetchParams } = useAppSelector((state) => state.customerContacts);
  const { user } = useAppSelector((state) => state.auth);
  const previousPathname = useRef(null as string | null);
  const headerRef = useRef(null as HTMLDivElement | null);
  const [headerHeight, setHeaderHeight] = useState(104);
  const hasMountedRef = useRef(false);
  const fetchInProgressRef = useRef(false);
  
  // Check if user can buy contacts
  const ableToBuyContacts = user?.ableToBuyContacts === true;

  const { countries: apiCountries } = useCountries();

  // Calculate header height dynamically - CRITICAL for sticky filter positioning
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        if (height > 0) {
          setHeaderHeight((prevHeight: number) => {
            // Only update if height actually changed to avoid unnecessary re-renders
            return height !== prevHeight ? height : prevHeight;
          });
        }
      }
    };

    // Immediate calculation - try multiple times to ensure we get the value
    updateHeaderHeight();

    // Use requestAnimationFrame for next frame
    const rafId = requestAnimationFrame(updateHeaderHeight);

    // Multiple timeouts to catch different render phases
    const timeout1 = setTimeout(updateHeaderHeight, 0);
    const timeout2 = setTimeout(updateHeaderHeight, 10);
    const timeout3 = setTimeout(updateHeaderHeight, 50);
    const timeout4 = setTimeout(updateHeaderHeight, 100);
    const timeout5 = setTimeout(updateHeaderHeight, 200);

    // Use ResizeObserver for real-time updates
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setHeaderHeight((prevHeight: number) => height !== prevHeight ? height : prevHeight);
        }
      }
    });

    // Observe header when it's available - with retry logic
    const observeHeader = () => {
      if (headerRef.current) {
        resizeObserver.observe(headerRef.current);
        updateHeaderHeight();
      } else {
        setTimeout(observeHeader, 10);
      }
    };
    observeHeader();

    // Also listen to window resize as fallback
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('load', updateHeaderHeight);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      clearTimeout(timeout5);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('load', updateHeaderHeight);
    };
  }, []); // Empty dependency array - only run on mount

  const [filters, setFilters] = useState({
    search: '',
    companyName: '',
    country: '',
    industry: '',
    revenue: '',
    employeeSize: '',
    limitFilter: '',
    excludeEmailsFile: null as File | null,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    companyName: '',
    country: '',
    industry: '',
    revenue: '',
    employeeSize: '',
    limitFilter: '',
    excludeEmailsFile: null as string | null, // base64 string
  });
  const [excludeEmailsFileName, setExcludeEmailsFileName] = useState(null);

  // Filter options
  const employeeSizes = [
    { label: '1 to 25', value: '1to25' },
    { label: '26 to 50', value: '26to50' },
    { label: '51 to 100', value: '51to100' },
    { label: '101 to 250', value: '101to250' },
    { label: '251 to 500', value: '251to500' },
    { label: '501 to 1000', value: '501to1000' },
    { label: '1001 to 2500', value: '1001to2500' },
    { label: '2501 to 5000', value: '2501to5000' },
    { label: '5001 to 10000', value: '5001to10000' },
    { label: 'over 10,001', value: 'over10001' }
  ];

  const revenues = [
    { label: 'Less than $1M', value: 'Lessthan1M' },
    { label: '$1M to $5M', value: '1Mto5M' },
    { label: '$5M to $10M', value: '5Mto10M' },
    { label: '$10M to $50M', value: '10Mto50M' },
    { label: '$50M to $100M', value: '50Mto100M' },
    { label: '$100M to $250M', value: '100Mto250M' },
    { label: '$250M to $500M', value: '250Mto500M' },
    { label: '$500M to $1B', value: '500Mto1B' },
    { label: 'More than $1B', value: 'Morethan1B' },
  ];

  const jobLevels = [
    { label: 'Analyst', value: 'Analyst' },
    { label: 'Below Manager', value: 'Below Manager' },
    { label: 'C-Level', value: 'C-Level' },
    { label: 'Developer', value: 'Developer' },
    { label: 'Director', value: 'Director' },
    { label: 'Engineer', value: 'Engineer' },
    { label: 'General Manager', value: 'General Manager' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Managing Director', value: 'Managing Director' },
    { label: 'Vice President', value: 'Vice President' },
    { label: 'Architect', value: 'Architect' }
  ];

  const jobRoles = [
    { label: 'Administration', value: 'Administration' },
    { label: 'Business Development', value: 'Business Development' },
    { label: 'Client Management', value: 'Client Management' },
    { label: 'Customer Experience', value: 'Customer Experience' },
    { label: 'Customer Success', value: 'Customer Success' },
    { label: 'Data & Analytics', value: 'Data & Analytics' },
    { label: 'Demand Generation', value: 'Demand Generation' },
    { label: 'Engineering', value: 'Engineering' },
    { label: 'Finance', value: 'Finance' },
    { label: 'Growth', value: 'Growth' },
    { label: 'Human Resources', value: 'Human Resources' },
    { label: 'Information Technology', value: 'Information Technology' },
    { label: 'Legal', value: 'Legal' },
    { label: 'Manufacturing', value: 'Manufacturing' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Operations', value: 'Operations' },
    { label: 'Others', value: 'Others' },
    { label: 'Procurement / Sourcing / Supply Chain', value: 'Procurement / Sourcing / Supply Chain' },
    { label: 'Product', value: 'Product' },
    { label: 'Quality', value: 'Quality' },
    { label: 'Risk & Compliance', value: 'Risk & Compliance' },
    { label: 'Sales', value: 'Sales' },
    { label: 'Sales & Marketing', value: 'Sales & Marketing' },
    { label: 'Strategy', value: 'Strategy' },
    { label: 'Underwriting', value: 'Underwriting' }
  ];

  // Industry list
  const industries = [
    { label: 'Agriculture, Forestry and Fishing', value: 'Agriculture, Forestry and Fishing' },
    { label: 'Aerospace and Defense', value: 'Aerospace and Defense' },
    { label: 'Automotive, Transportation and Logistics', value: 'Automotive, Transportation and Logistics' },
    { label: 'Banking and Finance', value: 'Banking and Finance' },
    { label: 'Business, Consulting and Professional Services', value: 'Business, Consulting and Professional Services' },
    { label: 'Chemicals', value: 'Chemicals' },
    { label: 'Construction and Building Materials', value: 'Construction and Building Materials' },
    { label: 'Consumer Services', value: 'Consumer Services' },
    { label: 'Education', value: 'Education' },
    { label: 'Electronics', value: 'Electronics' },
    { label: 'Entertainment, Travel and Leisure', value: 'Entertainment, Travel and Leisure' },
    { label: 'Food and Beverage', value: 'Food and Beverage' },
    { label: 'Healthcare, Biotechnology and Pharmaceuticals', value: 'Healthcare, Biotechnology and Pharmaceuticals' },
    { label: 'High Tech', value: 'High Tech' },
    { label: 'Insurance', value: 'Insurance' },
    { label: 'Manufacturing', value: 'Manufacturing' },
    { label: 'Mining, Quarrying and Drilling', value: 'Mining, Quarrying and Drilling' },
    { label: 'Non-Profit', value: 'Non-Profit' },
    { label: 'Government Administration', value: 'Government Administration' },
    { label: 'Real Estate', value: 'Real Estate' },
    { label: 'Rental and Leasing', value: 'Rental and Leasing' },
    { label: 'Retail', value: 'Retail' },
    { label: 'Telecommunications and Publishing', value: 'Telecommunications and Publishing' },
    { label: 'Utilities and Energy', value: 'Utilities and Energy' },
    { label: 'Wholesale', value: 'Wholesale' }
  ];

  const countries = [
    ...apiCountries.map((country: { name: string }) => ({
      label: country.name,
      value: country.name,
    })),
    { label: 'Other', value: 'Other' }
  ];

  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState(null as 'company' | 'jobTitle' | null);
  const [sortDirection, setSortDirection] = useState(1 as 1 | -1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [selectedContacts, setSelectedContacts] = useState([] as string[]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null as string | null);

  // Pricing constants 
  const PRICE_PER_CONTACT = 0.40;
  const totalCost = selectedContacts.length * PRICE_PER_CONTACT;

  // Helper function to check if params match
  const paramsMatch = (params1: GetCustomerContactsParams | null, params2: GetCustomerContactsParams): boolean => {
    if (!params1) return false;
    const keys = new Set([...Object.keys(params1), ...Object.keys(params2)]);
    for (const key of keys) {
      if (params1[key as keyof GetCustomerContactsParams] !== params2[key as keyof GetCustomerContactsParams]) {
        return false;
      }
    }
    return true;
  };

  // Fetch contacts on mount and when filters/sort/page changes
  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (fetchInProgressRef.current) {
      return;
    }

    const params: GetCustomerContactsParams = {
      page: currentPage,
      limit: limit,
    };

    if (appliedFilters.search) {
      params.search = appliedFilters.search;
    }
    if (appliedFilters.companyName) {
      params.companyName = appliedFilters.companyName;
    }
    if (appliedFilters.country) {
      params.country = appliedFilters.country;
    }
    if (appliedFilters.industry) {
      params.industry = appliedFilters.industry;
    }
    if (appliedFilters.revenue) {
      params.revenue = appliedFilters.revenue;
    }
    if (appliedFilters.employeeSize) {
      params.employeeSize = appliedFilters.employeeSize;
    }
    if (appliedFilters.limitFilter) {
      params.limitFilter = appliedFilters.limitFilter;
    }
    if (appliedFilters.excludeEmailsFile) {
      params.excludeEmailsFile = appliedFilters.excludeEmailsFile;
    }

    // Add sort parameters
    if (sortBy === 'company') {
      params.companySort = sortDirection;
    } else if (sortBy === 'jobTitle') {
      params.jobTitleSort = sortDirection;
    }

    // Check if we navigated to this page (pathname changed to /customer/contacts)
    const isNavigationToPage = previousPathname.current !== pathname && pathname === '/customer/contacts';

    // Check if we have cached data for the same params
    const hasCachedData = paramsMatch(lastFetchParams, params) && contacts.length > 0;

    // Always fetch when:
    // 1. No data exists AND we've never fetched before
    // 2. Params changed (filters or search changed)
    // 3. Navigating to this page - always fetch to get fresh data
    const shouldFetch =
      (contacts.length === 0 && lastFetchParams === null) ||
      !paramsMatch(lastFetchParams, params) ||
      isNavigationToPage;

    if (shouldFetch) {
      fetchInProgressRef.current = true;
      // If we have cached data for same params, fetch in background
      // Otherwise, fetch normally (will show loader)
      const background = hasCachedData && paramsMatch(lastFetchParams, params);
      dispatch(getCustomerContacts({ ...params, background })).finally(() => {
        fetchInProgressRef.current = false;
      });
      if (isNavigationToPage) {
        previousPathname.current = pathname;
      }
    }
  }, [dispatch, appliedFilters, sortBy, sortDirection, currentPage, limit, pathname, lastFetchParams, contacts.length]);

  const handleFileUpload = async (event: { target: { files?: FileList | null; value: string } }) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xls' && fileExtension !== 'xlsx') {
      alert('Please upload only .xls or .xlsx files');
      event.target.value = ''; // Clear input
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Remove data URL prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setFilters({ ...filters, excludeEmailsFile: file });
      setExcludeEmailsFileName(file.name);
    };
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      event.target.value = ''; // Clear input
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFilters({ ...filters, excludeEmailsFile: null });
    setExcludeEmailsFileName(null);
    // Also clear from applied filters if it was applied
    if (appliedFilters.excludeEmailsFile) {
      setAppliedFilters({ ...appliedFilters, excludeEmailsFile: null });
    }
  };

  const handleApplyFilters = async () => {
    // Convert file to base64 if a new file was selected
    let excludeEmailsFileBase64: string | null = appliedFilters.excludeEmailsFile;
    
    if (filters.excludeEmailsFile && filters.excludeEmailsFile !== appliedFilters.excludeEmailsFile) {
      // New file selected, convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        setAppliedFilters({ 
          ...filters, 
          excludeEmailsFile: base64 
        });
        setCurrentPage(1);
        setSelectedContacts([]);
      };
      reader.readAsDataURL(filters.excludeEmailsFile);
      return; // Will trigger useEffect when appliedFilters updates
    } else {
      // No new file, just apply existing filters
      setAppliedFilters({ 
        ...filters, 
        excludeEmailsFile: excludeEmailsFileBase64 
      });
      setCurrentPage(1);
      setSelectedContacts([]);
    }
  };

  const [resetKey, setResetKey] = useState(0);

  const resetFilters = () => {
    const emptyFilters = {
      search: '',
      companyName: '',
      country: '',
      industry: '',
      revenue: '',
      employeeSize: '',
      limitFilter: '',
      excludeEmailsFile: null as File | null,
    };
    setFilters(emptyFilters);
    setAppliedFilters({ ...emptyFilters, excludeEmailsFile: null });
    setExcludeEmailsFileName(null);
    setCurrentPage(1);
    setSortBy(null);
    setSortDirection(1);
    setResetKey((prev: number) => prev + 1); // Force re-render of Select components
  };

  const handleSortChange = (newSortBy: 'company' | 'jobTitle') => {
    if (sortBy === newSortBy) {
      // Toggle direction if same sort field
      setSortDirection(sortDirection === 1 ? -1 : 1);
    } else {
      // Set new sort field with ascending direction
      setSortBy(newSortBy);
      setSortDirection(1);
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setCurrentPage(1);
    // Note: limit is currently fixed, but this handler is ready if needed
  };

  // Helper function to get initials from contact name
  const getInitials = (contactName?: string, company?: string) => {
    if (contactName) {
      const parts = contactName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
      }
    }
    if (company) {
      return company.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Transform API contacts to match component structure
  const transformedContacts = contacts.map((contact, index) => ({
    id: contact._id?.toString() || contact.id || `contact-${index}`,
    _id: contact._id?.toString() || contact.id || `contact-${index}`, // Store actual _id
    name: contact.contact || contact.company || 'Unknown',
    title: contact.jobTitle || '',
    company: contact.company || '',
    industry: '',
    location: '',
    email: contact.email || '',
    phone: contact.phone || '',
    jobRole: '',
    jobLevel: '',
    employeeSize: '',
  }));

  // Memoize visible contacts to prevent unnecessary recalculations
  const visibleContacts = useMemo(() => {
    return ableToBuyContacts ? transformedContacts : transformedContacts.slice(0, 10);
  }, [transformedContacts, ableToBuyContacts]);

  const showPaywall = !ableToBuyContacts && transformedContacts.length > 10;
  const hasNoResults = !isLoading && transformedContacts.length === 0;

  // Filter selected contacts to only include those that are currently visible
  // This ensures that if filters change, only visible items remain selected
  useEffect(() => {
    if (visibleContacts.length > 0 && selectedContacts.length > 0) {
      const visibleIds = new Set(visibleContacts.map((c: { id: string }) => c.id));
      setSelectedContacts((prev: string[]) => {
        const filtered = prev.filter((id: string) => visibleIds.has(id));
        // Only update if selection actually changed to prevent infinite loops
        if (filtered.length !== prev.length) {
          return filtered;
        }
        // Check if any IDs are different
        const hasChanged = filtered.some((id, idx) => id !== prev[idx]);
        return hasChanged ? filtered : prev;
      });
    } else if (visibleContacts.length === 0 && selectedContacts.length > 0) {
      // If no visible contacts, clear all selections
      setSelectedContacts([]);
    }
  }, [visibleContacts]); // Now safe to use visibleContacts since it's memoized

  // Check if all visible contacts are selected
  const allSelected = visibleContacts.length > 0 && selectedContacts.length === visibleContacts.length;
  const someSelected = selectedContacts.length > 0 && selectedContacts.length < visibleContacts.length;

  const handleDownload = (contactId: string | number) => {
    if (!ableToBuyContacts) {
      alert('Please upgrade to download contacts');
      return;
    }
    console.log('Downloading contact:', contactId);
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header - Sticky */}
      <div ref={headerRef} className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#030000] text-2xl font-bold">Contact Search Filters</h1>
            <p className="text-gray-600 mt-1 text-sm">Find and explore contacts from our database</p>
          </div>
        </div>
      </div>

      {/* Filter Bar - Sticky - Must stick below header when scrolling */}
      <div
        className={`sticky z-20 bg-white border-b border-gray-200 px-8 py-4 shadow-sm transition-all duration-300 ${showFilters ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
        style={{
          top: `${headerHeight || 104}px`
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input - Wider (Keep it wide) */}
          <div className="relative flex-[2] min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Search by name, company"
              value={filters.search}
              onChange={(e: { target: { value: string } }) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 h-[46px] shadow-sm"
            />
          </div>

          {/* Company Name - Smaller */}
          <div className="relative w-[110px]">
            <input
              type="text"
              placeholder="Company Name"
              value={filters.companyName}
              onChange={(e: { target: { value: string } }) => setFilters({ ...filters, companyName: e.target.value })}
              className="w-40 px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 h-[46px] shadow-sm"
            />
          </div>

          {/* Country */}
          <div className="relative min-w-[150px]">
            <Select key={`country-${resetKey}`} value={filters.country || undefined} onValueChange={(value: string) => setFilters({ ...filters, country: value })}>
              <SelectTrigger className="w-40 px-4 py-3.5 h-[46px] border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent data-[size=default]:h-[46px] shadow-sm">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country: { label: string; value: string }) => (
                  <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Industry */}
          <div className="relative min-w-[150px]">
            <Select key={`industry-${resetKey}`} value={filters.industry || undefined} onValueChange={(value: string) => setFilters({ ...filters, industry: value })}>
              <SelectTrigger className="w-40 px-4 py-3.5 h-[46px] border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent data-[size=default]:h-[46px] shadow-sm">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>{industry.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Revenue */}
          <div className="relative min-w-[150px]">
            <Select key={`revenue-${resetKey}`} value={filters.revenue || undefined} onValueChange={(value: string) => setFilters({ ...filters, revenue: value })}>
              <SelectTrigger className="w-40 px-4 py-3.5 h-[46px] border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent data-[size=default]:h-[46px] shadow-sm">
                <SelectValue placeholder="All Revenue" />
              </SelectTrigger>
              <SelectContent>
                {revenues.map((revenue) => (
                  <SelectItem key={revenue.value} value={revenue.value}>{revenue.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Size */}
          <div className="relative min-w-[140px]">
            <Select key={`employeeSize-${resetKey}`} value={filters.employeeSize || undefined} onValueChange={(value: string) => setFilters({ ...filters, employeeSize: value })}>
              <SelectTrigger className="w-40 px-4 py-3.5 h-[46px] border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent data-[size=default]:h-[46px] shadow-sm">
                <SelectValue placeholder="Employee Size" />
              </SelectTrigger>
              <SelectContent>
                {employeeSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Limit Filter Input */}
          <div className="relative w-[120px]">
            <input
              type="number"
              placeholder="Limit (max 10000)"
              min="1"
              max="10000"
              value={filters.limitFilter}
              onChange={(e: { target: { value: string } }) => {
                const value = e.target.value;
                // Prevent values greater than 10000
                if (value === '' || (parseInt(value, 10) >= 1 && parseInt(value, 10) <= 10000)) {
                  setFilters({ ...filters, limitFilter: value });
                }
              }}
              onBlur={(e: { target: HTMLInputElement }) => {
                const target = e.target;
                const value = parseInt(target.value, 10);
                if (value > 10000) {
                  setFilters({ ...filters, limitFilter: '10000' });
                } else if (value < 1 && target.value !== '') {
                  setFilters({ ...filters, limitFilter: '1' });
                }
              }}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 h-[46px] shadow-sm"
            />
          </div>

          {/* Excel File Upload for Email Exclusion */}
          <div className="relative min-w-[200px]">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="exclude-emails-file-input"
              />
              <div className="flex items-center gap-2 px-4 py-3.5 h-[46px] border-2 border-gray-200 rounded-xl bg-white hover:border-[#2563EB] hover:bg-orange-50 transition-all cursor-pointer shadow-sm">
                {excludeEmailsFileName || filters.excludeEmailsFile ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileSpreadsheet className="text-[#2563EB] flex-shrink-0" size={18} />
                    <span className="text-sm text-gray-700 truncate">
                      {excludeEmailsFileName || filters.excludeEmailsFile?.name || 'File selected'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="ml-auto flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="text-gray-400" size={18} />
                    <span className="text-sm text-gray-600">Upload Excel (Exclude Emails)</span>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Apply Filters Button */}
          <button
            onClick={handleApplyFilters}
            className="px-6 py-3.5 h-[46px] bg-gradient-to-r from-[#2563EB] to-[#EB432F] text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap font-medium"
          >
            <Filter size={18} />
            Apply Filters
          </button>

          {/* Reset Filters Link */}
          <button
            onClick={resetFilters}
            type="button"
            className="text-gray-600 hover:text-[#2563EB] transition-colors underline text-sm whitespace-nowrap"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Results Header */}
        {!error && (
          <div className="mb-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Search className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-[#030000]">Search Results</p>
                  <p className="text-gray-600 text-sm">
                    Showing <span className="text-[#2563EB]">{visibleContacts.length}</span> of <span className="text-[#030000]">{pagination?.totalCount || 0}</span> contacts
                    {selectedContacts.length > 0 && (
                      <span className="ml-2 text-[#2563EB] font-medium">
                        ({selectedContacts.length} selected)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={sortBy || ''}
                    onChange={(e: { target: { value: string } }) => {
                      if (e.target.value) {
                        handleSortChange(e.target.value as 'company' | 'jobTitle');
                      } else {
                        setSortBy(null);
                        setSortDirection(1);
                      }
                    }}
                    className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent appearance-none bg-white shadow-sm pr-10"
                  >
                    <option value="">Default Sort...</option>
                    <option value="company">Sort by Company {sortBy === 'company' ? (sortDirection === 1 ? '↑' : '↓') : ''}</option>
                    <option value="jobTitle">Sort by Job Title {sortBy === 'jobTitle' ? (sortDirection === 1 ? '↑' : '↓') : ''}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
                {!ableToBuyContacts && (
                  <div className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-3 rounded-xl border border-red-200">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertCircle className="text-[#EB432F]" size={18} />
                    </div>
                    <div>
                      <p className="text-[#EB432F] text-sm">Free Preview Mode</p>
                      <p className="text-gray-600 text-xs">Limited to 10 contacts</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && hasNoResults && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-[#030000] mb-2">No Results Found</h3>
            <p className="text-gray-600 mb-4">Try fewer filters or contact us for a custom dataset.</p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-gradient-to-r from-[#2563EB] to-[#EB432F] text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
          <div
            className="overflow-x-auto customer-contacts-table-scroll"
            style={{
              maxWidth: '100%',
              scrollbarWidth: 'thin',
              scrollbarColor: '#2563EB #f1f1f1'
            }}
          >
            <table className="w-full" style={{ minWidth: '1200px' }}>
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <th className="text-left px-4 py-4 w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedContacts(visibleContacts.map((contact: { id: string; _id?: string }) => contact.id));
                        } else {
                          setSelectedContacts([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-gray-700">Contact</span>
                    </div>
                  </th>
                  <th className="text-left px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-gray-700">Job Title</span>
                    </div>
                  </th>
                  <th className="text-left px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span className="text-gray-700">Company</span>
                    </div>
                  </th>
                  <th className="text-left px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-gray-700">Email</span>
                    </div>
                  </th>
                  <th className="text-left px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <span className="text-gray-700">Phone</span>
                    </div>
                  </th>
                  <th className="text-left px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      <span className="text-gray-700">Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    {[...Array(10)].map((_, index) => (
                      <tr key={`skeleton-${index}`} className="border-b border-gray-100">
                        <td className="px-4 py-4">
                          <Skeleton className="h-4 w-4 rounded" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Skeleton className="h-4 w-40" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Skeleton className="h-10 w-48 rounded-lg" />
                        </td>
                        <td className="px-4 py-4">
                          <Skeleton className="h-10 w-40 rounded-lg" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <Skeleton className="h-10 w-10 rounded-xl" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline"> {error}</span>
                      </div>
                    </td>
                  </tr>
                ) : !hasNoResults ? (
                  visibleContacts.map((contact: { id: string; _id?: string; name: string; title: string; company: string; industry: string; location: string; email: string; phone: string; jobRole: string; jobLevel: string; employeeSize: string; revenue: string; technology: string }, index: number) => (
                    <tr
                      key={contact.id}
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 transition-all group"
                      style={{
                        animation: `slideInRow 0.3s ease-out ${index * 0.03}s both`
                      }}
                    >
                      {/* Checkbox Column */}
                      <td className="px-4 py-4" onClick={(e: any) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked: boolean) => {
                            // Multiple selection: toggle contact
                            if (checked) {
                              setSelectedContacts([...selectedContacts, contact.id]);
                            } else {
                              setSelectedContacts(selectedContacts.filter((id: string) => id !== contact.id));
                            }
                          }}
                        />
                      </td>
                      {/* Contact Column */}
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <Lock className="text-gray-500" size={14} />
                          <span className="text-gray-400 blur-[4px] select-none pointer-events-none text-xs">
                            {contact.name || 'Contact'}
                          </span>
                        </div>
                      </td>
                      {/* Job Title Column */}
                      <td className="px-4 py-4">
                        <span className="text-gray-700 text-sm">{contact.title}</span>
                      </td>
                      {/* Company Column */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#EB432F] flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[#030000] group-hover:text-[#2563EB] transition-colors">{contact.company || 'Unknown'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <Lock className="text-gray-500" size={14} />
                          <span className="text-gray-400 blur-[4px] select-none pointer-events-none text-xs">{contact.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <Lock className="text-gray-500" size={14} />
                          <span className="text-gray-400 blur-[4px] select-none pointer-events-none text-xs">{contact.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(contact.id)}
                            className={`p-3 rounded-xl transition-all ${ableToBuyContacts
                                ? 'bg-gradient-to-r from-[#2563EB] to-[#EB432F] text-white hover:shadow-lg hover:scale-105'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              }`}
                            disabled={!ableToBuyContacts}
                            title={ableToBuyContacts ? 'Download' : 'Locked'}
                          >
                             <Lock size={16} />
                          </button>
                          <button
                            className="p-3 border-2 border-gray-200 rounded-xl hover:border-[#2563EB] hover:bg-orange-50 transition-all hover:scale-105"
                            title="View Details"
                          >
                            <Eye size={16} className="text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View - Visible Only on Mobile */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            <>
              {[...Array(5)].map((_, index) => (
                <div key={`skeleton-mobile-${index}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                    <Skeleton className="h-4 w-4 rounded flex-shrink-0 mt-1" />
                    <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-3 w-20 mb-1" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-3 w-24 mb-1" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <Skeleton className="h-12 flex-1 rounded-xl" />
                    <Skeleton className="h-12 w-12 rounded-xl" />
                  </div>
                </div>
              ))}
            </>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : !hasNoResults ? (
            visibleContacts.map((contact: { id: string; _id?: string; name: string; title: string; company: string; industry: string; location: string; email: string; phone: string; jobRole: string; jobLevel: string; employeeSize: string; revenue: string; technology: string }, index: number) => (
              <div
                key={contact.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all"
                style={{
                  animation: `slideUp 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                {/* Contact Header */}
                <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="mt-1 flex-shrink-0" onClick={(e: any) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked: boolean) => {
                        // Multiple selection: toggle contact
                        if (checked) {
                          setSelectedContacts([...selectedContacts, contact.id]);
                        } else {
                          setSelectedContacts(selectedContacts.filter((id: string) => id !== contact.id));
                        }
                      }}
                    />
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#EB432F] flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <Lock size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-fit">
                        <Lock className="text-gray-500" size={14} />
                        <span className="text-gray-400 blur-[4px] select-none text-sm">
                          {contact.company || 'Company'}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-fit">
                        <Lock className="text-gray-500" size={14} />
                        <span className="text-gray-400 blur-[4px] select-none text-xs">
                          {contact.title || 'Title'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-3 mb-4">
                  {/* Company */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Company</p>
                      <p className="text-[#030000]">{contact.company}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-md">
                        {contact.industry}
                      </span>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Email Address</p>
                      <div className="flex items-center gap-2">
                        <Lock className="text-gray-500" size={14} />
                        <span className="text-gray-400 blur-[4px] select-none text-sm">{contact.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                      <div className="flex items-center gap-2">
                        <Lock className="text-gray-500" size={14} />
                        <span className="text-gray-400 blur-[4px] select-none text-sm">{contact.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleDownload(contact.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${ableToBuyContacts
                        ? 'bg-gradient-to-r from-[#2563EB] to-[#EB432F] text-white hover:shadow-lg'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    disabled={!ableToBuyContacts}
                  >
                    <Lock size={16} />
                    <span className="text-sm">Locked</span>
                  </button>
                  <button className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-[#2563EB] hover:bg-orange-50 transition-all">
                    <Eye size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>
            ))
          ) : null}
        </div>


        {/* Unlock & Download Banner - Sticky at Bottom */}
        {!ableToBuyContacts && !error && (
          <div className="sticky bottom-0 z-50 mt-8">
            <div className="bg-gradient-to-r from-[#FFF3EC] to-[#FFE8DC] border-2 border-[#2563EB] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#EB432F] flex items-center justify-center shadow-lg flex-shrink-0">
                    <Lock className="text-white" size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[#030000] font-semibold mb-1 text-lg">If you want more contacts then download first 10 contacts</h3>
                    <p className="text-gray-700 text-sm">Upgrade now to unlock full contact details and access our complete database of {pagination?.totalCount || 11}+ contacts</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (selectedContacts.length === 10 && !appliedFilters.limitFilter) {
                      setShowPaymentModal(true);
                    }
                  }}
                  disabled={selectedContacts.length !== 10 || !!appliedFilters.limitFilter}
                  className={`group px-8 py-4 rounded-xl transition-all flex items-center gap-3 shadow-lg whitespace-nowrap flex-shrink-0 font-medium ${selectedContacts.length === 10 && !appliedFilters.limitFilter
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#EB432F] text-white hover:shadow-2xl hover:scale-105 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                    }`}
                >
                  <span>Unlock & Download Contacts</span>
                  <svg className={`w-5 h-5 transition-transform ${selectedContacts.length === 10 && !appliedFilters.limitFilter ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Buy Contacts Banner - When ableToBuyContacts is true */}
        {ableToBuyContacts && !error && (
          <div className="sticky bottom-0 z-50 mt-8">
            <div className="bg-gradient-to-r from-[#FFF3EC] to-[#FFE8DC] border-2 border-[#2563EB] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#EB432F] flex items-center justify-center shadow-lg flex-shrink-0">
                    <Lock className="text-white" size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[#030000] font-semibold mb-1 text-lg">If you want more contacts then download first 10 contacts</h3>
                    <p className="text-gray-700 text-sm">Upgrade now to unlock full contact details and access our complete database of {pagination?.totalCount || 11}+ contacts</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (selectedContacts.length > 0) {
                      setShowPaymentModal(true);
                    }
                  }}
                  disabled={selectedContacts.length === 0}
                  className={`group px-8 py-4 rounded-xl transition-all flex items-center gap-3 shadow-lg whitespace-nowrap flex-shrink-0 font-medium ${selectedContacts.length > 0
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#EB432F] text-white hover:shadow-2xl hover:scale-105 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                    }`}
                >
                  <span>Buy Contacts</span>
                  <svg className={`w-5 h-5 transition-transform ${selectedContacts.length > 0 ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#030000] flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#EB432F] flex items-center justify-center">
                <CreditCard className="text-white" size={24} />
              </div>
              Payment for Contacts
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Review your order and proceed to payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-[#030000] mb-4">Order Summary</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <p className="text-gray-700 font-medium">Selected Contacts</p>
                    <p className="text-sm text-gray-500">{selectedContacts.length} contacts</p>
                  </div>
                  <span className="text-gray-700 font-medium">{selectedContacts.length}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <p className="text-gray-700 font-medium">Price per Contact</p>
                  </div>
                  <span className="text-gray-700 font-medium">${PRICE_PER_CONTACT.toFixed(2)}</span>
                </div>

                {/* Calculation */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Calculation:</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">
                      {selectedContacts.length} contacts × ${PRICE_PER_CONTACT.toFixed(2)}
                    </span>
                    <span className="text-[#2563EB] font-semibold">
                      = ${totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-[#030000]">Total Amount</span>
                  <span className="text-2xl font-bold text-[#2563EB]">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Payment Information</p>
                  <p>You will be redirected to a secure payment gateway to complete your purchase.</p>
                </div>
              </div>
            </div>
          </div>

          {!paymentSuccess && !paymentError && (
            <div className="mt-4">
              <PayPalPayment
                amount={totalCost}
                currency="USD"
                type="contacts"
                itemIds={selectedContacts.map((id: string) => {
                  const contact = transformedContacts.find((c: { id: string; _id?: string }) => c.id === id);
                  return contact?._id || id;
                })}
                itemCount={selectedContacts.length}
                pricePerItem={PRICE_PER_CONTACT}
                onSuccess={async (paymentData) => {
                  setPaymentSuccess(true);
                  setPaymentError(null);
                  // File is saved and can be accessed from My Downloads page
                  // Redirect to downloads tab after successful payment
                  setActiveTab('downloads');
                  // Refresh user data to get updated ableToBuyContacts flag
                  try {
                    const response = await privateApiCall<{ customer: any }>('/customers/setting/profile');
                    if (response.customer) {
                      dispatch(updateUser({
                        ableToBuyContacts: response.customer.ableToBuyContacts || false,
                        ableToBuyCompanies: response.customer.ableToBuyCompanies || false,
                      }));
                      // Refetch contacts to show all data if ableToBuyContacts is now true
                      if (response.customer.ableToBuyContacts) {
                        const params: GetCustomerContactsParams = {
                          page: currentPage,
                          limit: limit,
                          limitFilter: '10000', // Fetch all contacts
                        };
                        if (appliedFilters.search) params.search = appliedFilters.search;
                        if (appliedFilters.companyName) params.companyName = appliedFilters.companyName;
                        if (appliedFilters.country) params.country = appliedFilters.country;
                        if (appliedFilters.industry) params.industry = appliedFilters.industry;
                        if (appliedFilters.revenue) params.revenue = appliedFilters.revenue;
                        if (appliedFilters.employeeSize) params.employeeSize = appliedFilters.employeeSize;
                        if (sortBy === 'company') params.companySort = sortDirection;
                        else if (sortBy === 'jobTitle') params.jobTitleSort = sortDirection;
                        dispatch(getCustomerContacts({ ...params, background: false }));
                      }
                    }
                  } catch (error) {
                    console.error('Failed to refresh user data:', error);
                  }
                }}
                onError={(error) => {
                  setPaymentError(error);
                  setPaymentSuccess(false);
                }}
                onCancel={() => {
                  setShowPaymentModal(false);
                }}
              />
            </div>
          )}

          {paymentSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Payment Successful!</p>
                  <p>Your download has started. You can also find it in your downloads section.</p>
                </div>
              </div>
            </div>
          )}

          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Payment Error</p>
                  <p>{paymentError}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3 sm:gap-0 mt-4">
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setPaymentSuccess(false);
                setPaymentError(null);
              }}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all"
            >
              {paymentSuccess ? 'Close' : 'Cancel'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRow {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .button-disabled {
          transition: background 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                      color 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .button-enabled {
          transition: background 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                      color 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: buttonEnable 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes buttonEnable {
          0% {
            transform: scale(1);
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(239, 128, 55, 0.3);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
        }
      `}</style>
    </div>
  );
}
