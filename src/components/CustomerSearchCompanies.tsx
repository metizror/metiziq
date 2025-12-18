import React, { useEffect, useRef, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  Search,
  Filter,
  Download,
  Eye,
  Lock,
  AlertCircle,
  ChevronDown,
  Building2,
  Globe,
  MapPin,
  Phone,
  BarChart,
  CreditCard,
  Upload,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { CountrySelect } from '@/components/CountrySelect';
import { updateUser } from '@/store/slices/auth.slice';
import { privateApiCall } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { useCountries } from '@/hooks/useCountries';
import PayPalPayment from './PayPalPayment';
import {
  getCustomerCompanies,
  type GetCustomerCompaniesParams,
  initialCustomerCompaniesState,
} from '@/store/slices/customerCompanies.slice';

interface CustomerSearchCompaniesProps {
  isPaid: boolean;
  setActiveTab: (tab: string) => void;
}

export default function CustomerSearchCompanies({ isPaid, setActiveTab }: CustomerSearchCompaniesProps) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const customerCompaniesState =
    useAppSelector((state) => state.customerCompanies) || initialCustomerCompaniesState;

  const { companies, pagination, isLoading, isRefreshing, error, lastFetchParams } = customerCompaniesState;
  const { user } = useAppSelector((state) => state.auth);
  const previousPathname = useRef(null as string | null);
  const fetchInProgressRef = useRef(false);
  const { countries: apiCountries } = useCountries();
  
  // Check if user can buy companies
  const ableToBuyCompanies = user?.ableToBuyCompanies === true;

  const [filters, setFilters] = useState({
    search: '',
    company: '',
    industry: '',
    country: '',
    employeeSize: '',
    revenue: '',
    limitFilter: '',
    excludeEmailsFile: null as File | null,
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    company: '',
    industry: '',
    country: '',
    employeeSize: '',
    revenue: '',
    limitFilter: '',
    excludeEmailsFile: null as string | null, // base64 string
  });
  const [excludeEmailsFileName, setExcludeEmailsFileName] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [showFilters, setShowFilters] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [selectedCompanies, setSelectedCompanies] = useState([] as string[]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null as string | null);
  const headerRef = useRef(null as HTMLDivElement | null);
  const [headerHeight, setHeaderHeight] = useState(104);

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
  }, []);
  // Pricing constants
  const PRICE_PER_CONTACT = 0.25;
  const totalCost = selectedCompanies.length * PRICE_PER_CONTACT;

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

  const revenueOptions = [
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

  // Industry list
  const industries = [
    { label: 'Aerospace & Defense', value: 'Aerospace & Defense' },
    { label: 'Agriculture', value: 'Agriculture' },
    { label: 'Automotive', value: 'Automotive' },
    { label: 'Banking', value: 'Banking' },
    { label: 'Biotechnology', value: 'Biotechnology' },
    { label: 'Chemicals', value: 'Chemicals' },
    { label: 'Construction', value: 'Construction' },
    { label: 'Consumer Goods', value: 'Consumer Goods' },
    { label: 'Education', value: 'Education' },
    { label: 'Energy', value: 'Energy' },
    { label: 'Entertainment', value: 'Entertainment' },
    { label: 'Financial Services', value: 'Financial Services' },
    { label: 'Food & Beverage', value: 'Food & Beverage' },
    { label: 'Healthcare', value: 'Healthcare' },
    { label: 'Hospitality', value: 'Hospitality' },
    { label: 'Insurance', value: 'Insurance' },
    { label: 'Legal', value: 'Legal' },
    { label: 'Manufacturing', value: 'Manufacturing' },
    { label: 'Media & Publishing', value: 'Media & Publishing' },
    { label: 'Mining', value: 'Mining' },
    { label: 'Non-Profit', value: 'Non-Profit' },
    { label: 'Pharmaceuticals', value: 'Pharmaceuticals' },
    { label: 'Real Estate', value: 'Real Estate' },
    { label: 'Retail', value: 'Retail' },
    { label: 'Technology', value: 'Technology' },
    { label: 'Telecommunications', value: 'Telecommunications' },
    { label: 'Transportation', value: 'Transportation' },
    { label: 'Utilities', value: 'Utilities' },
    { label: 'Other', value: 'Other' }
  ];

  const countries = [
    ...apiCountries.map((country: { name: string }) => ({
      label: country.name,
      value: country.name,
    })),
    { label: 'Other', value: 'Other' }
  ];

  const paramsMatch = (params1: GetCustomerCompaniesParams | null, params2: GetCustomerCompaniesParams): boolean => {
    if (!params1) return false;
    const keys = new Set([...Object.keys(params1), ...Object.keys(params2)]);
    for (const key of keys) {
      if (params1[key as keyof GetCustomerCompaniesParams] !== params2[key as keyof GetCustomerCompaniesParams]) {
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (fetchInProgressRef.current) {
      return;
    }

    const params: GetCustomerCompaniesParams = { page: currentPage, limit };
    
    if (appliedFilters.search) params.search = appliedFilters.search;
    if (appliedFilters.company) params.company = appliedFilters.company;
    if (appliedFilters.industry) params.industry = appliedFilters.industry;
    if (appliedFilters.country) params.country = appliedFilters.country;
    if (appliedFilters.employeeSize) params.employeeSize = appliedFilters.employeeSize;
    if (appliedFilters.revenue) params.revenue = appliedFilters.revenue;
    if (appliedFilters.excludeEmailsFile) {
      params.excludeEmailsFile = appliedFilters.excludeEmailsFile;
    }
    
    // If ableToBuyCompanies is true and no limitFilter, fetch all companies (set high limit)
    // Otherwise, use the limitFilter from appliedFilters if it exists
    if (appliedFilters.limitFilter) {
      params.limitFilter = appliedFilters.limitFilter;
    } else if (ableToBuyCompanies) {
      params.limitFilter = '10000'; // Set high limit to fetch all companies
    }

    const isNavigationToPage = previousPathname.current !== pathname && pathname === '/customer/companies';
    const hasCachedData = paramsMatch(lastFetchParams, params) && companies.length > 0;
    const shouldFetch =
      (companies.length === 0 && lastFetchParams === null) ||
      !paramsMatch(lastFetchParams, params) ||
      isNavigationToPage;

    if (shouldFetch) {
      fetchInProgressRef.current = true;
      const background = hasCachedData && paramsMatch(lastFetchParams, params);
      dispatch(getCustomerCompanies({ ...params, background })).finally(() => {
        fetchInProgressRef.current = false;
      });
      if (isNavigationToPage) {
        previousPathname.current = pathname;
      }
    }
  }, [dispatch, appliedFilters, currentPage, limit, pathname, lastFetchParams, companies.length, ableToBuyCompanies]);

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
        setSelectedCompanies([]);
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
      setSelectedCompanies([]);
    }
  };

  const resetFilters = () => {
    const cleared = { 
      search: '', 
      company: '', 
      industry: '', 
      country: '', 
      employeeSize: '', 
      revenue: '', 
      limitFilter: '',
      excludeEmailsFile: null as File | null,
    };
    setFilters(cleared);
    setAppliedFilters({ ...cleared, excludeEmailsFile: null });
    setExcludeEmailsFileName(null);
    setCurrentPage(1);
    setResetKey((prev: number) => prev + 1); // Force re-render of Select components
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const transformedCompanies = companies.map((company, index) => {
    const fullAddress = [company.address1, company.address2].filter(Boolean).join(', ');
    const location = [company.city, company.state].filter(Boolean).join(', ');
    const locationWithZip = [fullAddress, company.zipCode].filter(Boolean).join(', ');
    const locationFull = locationWithZip ? `${locationWithZip}, ${company.country || ''}` : location || company.country || '';
    const companyId = company.id || company._id?.toString() || `${company.companyName}-${index}`;
    return {
      id: companyId,
      _id: company._id?.toString() || company.id || companyId, // Store actual _id
      companyName: company.companyName || 'Unknown company',
      companyLocation: location, // City, State for display below company name
      phone: company.phone || 'Not Provided',
      location: locationFull, // Full address with zip and country
      website: company.website || '',
      revenue: company.revenue || 'N/A',
      employeeSize: company.employeeSize || 'N/A',
      industry: company.industry || 'N/A',
      technology: company.technology || 'N/A'
    };
  });

  // Memoize visible companies to prevent unnecessary recalculations
  const visibleCompanies = useMemo(() => {
    return ableToBuyCompanies ? transformedCompanies : transformedCompanies.slice(0, 10);
  }, [transformedCompanies, ableToBuyCompanies]);

  const showPaywall = !ableToBuyCompanies && transformedCompanies.length > 10;
  const hasNoResults = !isLoading && transformedCompanies.length === 0;

  // Filter selected companies to only include those that are currently visible
  // This ensures that if filters change, only visible items remain selected
  useEffect(() => {
    if (visibleCompanies.length > 0 && selectedCompanies.length > 0) {
      const visibleIds = new Set(visibleCompanies.map((c: { id: string }) => c.id));
      setSelectedCompanies((prev: string[]) => {
        const filtered = prev.filter((id: string) => visibleIds.has(id));
        // Only update if selection actually changed to prevent infinite loops
        if (filtered.length !== prev.length) {
          return filtered;
        }
        // Check if any IDs are different
        const hasChanged = filtered.some((id, idx) => id !== prev[idx]);
        return hasChanged ? filtered : prev;
      });
    } else if (visibleCompanies.length === 0 && selectedCompanies.length > 0) {
      // If no visible companies, clear all selections
      setSelectedCompanies([]);
    }
  }, [visibleCompanies]); // Now safe to use visibleCompanies since it's memoized

  // Check if all visible companies are selected
  const allSelected = visibleCompanies.length > 0 && selectedCompanies.length === visibleCompanies.length;
  const someSelected = selectedCompanies.length > 0 && selectedCompanies.length < visibleCompanies.length;

  const handleDownload = (companyId: string | number) => {
    if (!ableToBuyCompanies) return;
    console.log('Downloading company:', companyId);
  };

  return (
    <div className="flex-1 bg-gray-50" style={{ overflowY: 'auto', height: '100%' }}>
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-6 shadow-sm flex items-center justify-between z-50">
        <div>
          <h1 className="text-[#030000] text-2xl font-bold">Company Search Filters</h1>
          <p className="text-gray-600 mt-1 text-sm">Discover companies tailored to your ICP</p>
        </div>
        {isRefreshing && <span className="text-xs text-gray-500 animate-pulse">Refreshing…</span>}
      </div>

      {/* Filter Bar - Sticky */}
      <div className={`sticky z-20 bg-white border-b border-gray-200 px-8 py-4 shadow-sm transition-all duration-300 ${showFilters ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`} style={{
          top: `${headerHeight || 104}px`
        }}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input - Wider */}
          <div className="relative flex-[2] min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Search by company name, industry, or location..."
              value={filters.search}
              onChange={(e: { target: { value: string } }) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 h-[46px] shadow-sm"
            />
          </div>

          {/* Company Name - Smaller */}
          <div className="relative w-[140px]">
            <input
              type="text"
              placeholder="Company Name"
              value={filters.company}
              onChange={(e: { target: { value: string } }) => setFilters({ ...filters, company: e.target.value })}
              className="w-40 px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 h-[46px] shadow-sm"
            />
          </div>

          {/* All Industries */}
          <div className="relative min-w-[150px]">
            <Select key={`industry-${resetKey}`} value={filters.industry || undefined} onValueChange={(value: string) => setFilters({ ...filters, industry: value })}>
              <SelectTrigger className="w-full px-4 py-3.5 h-[46px] border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent data-[size=default]:h-[46px] shadow-sm">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>{industry.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div className="relative min-w-[150px]">
            <Select key={`country-${resetKey}`} value={filters.country || undefined} onValueChange={(value: string) => setFilters({ ...filters, country: value })}>
              <SelectTrigger className="w-full px-4 py-3.5 h-[46px] border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent data-[size=default]:h-[46px] shadow-sm">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Size */}
          <div className="relative min-w-[140px]">
            <Select key={`employeeSize-${resetKey}`} value={filters.employeeSize || undefined} onValueChange={(value: string) => setFilters({ ...filters, employeeSize: value })}>
              <SelectTrigger className="w-full px-4 py-3.5 h-[46px] border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent data-[size=default]:h-[46px] shadow-sm">
                <SelectValue placeholder="Employee Size" />
              </SelectTrigger>
              <SelectContent>
                {employeeSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* All Revenue */}
          <div className="relative min-w-[140px]">
            <Select key={`revenue-${resetKey}`} value={filters.revenue || undefined} onValueChange={(value: string) => setFilters({ ...filters, revenue: value })}>
              <SelectTrigger className="w-full px-4 py-3.5 h-[46px] border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent data-[size=default]:h-[46px] shadow-sm">
                <SelectValue placeholder="All Revenue" />
              </SelectTrigger>
              <SelectContent>
                {revenueOptions.map((revenue) => (
                  <SelectItem key={revenue.value} value={revenue.value}>{revenue.label}</SelectItem>
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
                id="exclude-emails-file-input-companies"
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
                    <span className="text-sm text-gray-600">Upload Excel (Exclude Company Name)</span>
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

      <div className="p-8">
        {!error && (
          <div className="mb-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Building2 className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-[#030000]">Search Results</p>
                  <p className="text-gray-600 text-sm">
                    Showing <span className="text-[#2563EB]">{visibleCompanies.length}</span> of{' '}
                    <span className="text-[#030000]">{pagination?.totalCount || 0}</span> companies
                    {selectedCompanies.length > 0 && (
                      <span className="ml-2 text-[#2563EB] font-medium">
                        ({selectedCompanies.length} selected)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!ableToBuyCompanies && (
                  <div className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-3 rounded-xl border border-red-200">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertCircle className="text-[#EB432F]" size={18} />
                    </div>
                    <div>
                      <p className="text-[#EB432F] text-sm">Free Preview Mode</p>
                      <p className="text-gray-600 text-xs">Limited to 10 companies</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!error && hasNoResults && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="text-gray-400" size={32} />
            </div>
            <h3 className="text-[#030000] mb-2">No Results Found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search keyword.</p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-gradient-to-r from-[#2563EB] to-[#EB432F] text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}

        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
          <div
            className="overflow-x-auto customer-contacts-table-scroll"
            style={{
              maxWidth: '100%',
              minHeight: '200px',
              overflowY: 'hidden',
              scrollbarWidth: 'thin',
              scrollbarColor: '#2563EB #f1f1f1'
            }}
          >
            <table className="w-full" style={{ minWidth: '1440px', tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <th className="text-left px-4 py-4 w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedCompanies(visibleCompanies.map((company: { id: string; _id?: string }) => company.id));
                        } else {
                          setSelectedCompanies([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left px-4 py-4" style={{ width: '160px' }}>
                    <span className="text-gray-700 font-semibold">Company Name</span>
                  </th>
                  <th className="text-left px-4 py-4" style={{ width: '160px' }}>
                    <span className="text-gray-700 font-semibold">Phone</span>
                  </th>
                  <th className="text-left px-4 py-4" style={{ width: '160px' }}>
                    <span className="text-gray-700 font-semibold">Location</span>
                  </th>
                  <th className="text-left px-4 py-4" style={{ width: '160px' }}>
                    <span className="text-gray-700 font-semibold">Website</span>
                  </th>
                  <th className="text-left px-4 py-4" style={{ width: '160px' }}>
                    <span className="text-gray-700 font-semibold">Revenue</span>
                  </th>
                  <th className="text-left px-4 py-4" style={{ width: '160px' }}>
                    <span className="text-gray-700 font-semibold">Employee Size</span>
                  </th>
                  <th className="text-left px-4 py-4" style={{ width: '160px' }}>
                    <span className="text-gray-700 font-semibold">Industry</span>
                  </th>
                  <th className="text-left px-4 py-4" style={{ width: '160px' }}>
                    <span className="text-gray-700 font-semibold">Technology</span>
                  </th>
                  <th className="text-left px-4 py-4" style={{ width: '160px' }}>
                    <span className="text-gray-700 font-semibold">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(8)].map((_, index) => (
                    <tr key={`companies-skeleton-${index}`} className="border-b border-gray-100">
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-4 rounded" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-12 w-12 rounded-xl" />
                          <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-44" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <Skeleton className="h-10 w-10 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center">
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl inline-flex gap-3 items-center">
                        <AlertCircle className="text-red-600" size={18} />
                        <span>{error}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleCompanies.map((company: { id: string; _id?: string; companyName: string; companyLocation: string; phone: string; location: string; website: string; revenue: string; employeeSize: string; industry: string; technology: string }, index: number) => {
                    // If ableToBuyCompanies is true, show companyName and location unblurred
                    // Otherwise, blur all fields after the first 5 companies (index > 4)
                    const shouldBlur = ableToBuyCompanies ? false : index > 4;
                    
                    return (
                    <tr
                      key={company.id}
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 transition-all group"
                      style={{ animation: `slideInRow 0.3s ease-out ${index * 0.03}s both` }}
                    >
                      {/* Checkbox Column */}
                      <td className="px-4 py-4" onClick={(e: any) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedCompanies.includes(company.id)}
                          onCheckedChange={(checked: boolean) => {
                            // Multiple selection: toggle company
                            if (checked) {
                              setSelectedCompanies([...selectedCompanies, company.id]);
                            } else {
                              setSelectedCompanies(selectedCompanies.filter((id: string) => id !== company.id));
                            }
                          }}
                        />
                      </td>
                      {/* Company Name Column */}
                      <td className="px-4 py-4" style={{ width: '160px', overflow: 'hidden' }}>
                        {ableToBuyCompanies ? (
                          <div className="overflow-hidden">
                            <p className="text-[#030000] font-medium truncate" title={company.companyName}>{company.companyName}</p>
                            {company.companyLocation && (
                              <p className="text-gray-500 text-xs mt-1 truncate" title={company.companyLocation}>{company.companyLocation}</p>
                            )}
                          </div>
                        ) : shouldBlur ? (
                          <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-full overflow-hidden">
                            <Lock className="text-gray-500 flex-shrink-0" size={14} />
                            <span className="text-gray-400 blur-[4px] select-none pointer-events-none text-xs truncate min-w-0 flex-1">{company.companyName || '-'}</span>
                          </div>
                        ) : (
                          <div className="overflow-hidden">
                            <p className="text-[#030000] font-medium truncate" title={company.companyName}>{company.companyName}</p>
                            {company.companyLocation && (
                              <p className="text-gray-500 text-xs mt-1 truncate" title={company.companyLocation}>{company.companyLocation}</p>
                            )}
                          </div>
                        )}
                      </td>
                      {/* Phone Column - Always blurred */}
                      <td className="px-4 py-4" style={{ width: '160px', overflow: 'hidden' }}>
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-full overflow-hidden">
                          <Lock className="text-gray-500 flex-shrink-0" size={14} />
                          <span className="text-gray-400 blur-[4px] select-none pointer-events-none text-xs truncate min-w-0 flex-1">{company.phone || '-'}</span>
                        </div>
                      </td>
                      {/* Location Column */}
                      <td className="px-4 py-4" style={{ width: '160px', overflow: 'hidden' }}>
                        {ableToBuyCompanies ? (
                          <div className="overflow-hidden">
                            {company.location ? (
                              <>
                                <p className="text-gray-700 text-sm truncate" title={company.location.split(',')[0]}>{company.location.split(',')[0] || '-'}</p>
                                {company.location.split(',').length > 1 && (
                                  <p className="text-gray-500 text-xs mt-1 truncate" title={company.location.split(',').slice(1).join(',').trim()}>
                                    {company.location.split(',').slice(1).join(',').trim()}
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-700 text-sm">-</span>
                            )}
                          </div>
                        ) : shouldBlur ? (
                          <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-full overflow-hidden">
                            <Lock className="text-gray-500 flex-shrink-0" size={14} />
                            <span className="text-gray-400 blur-[4px] select-none pointer-events-none text-xs truncate min-w-0 flex-1">
                              {company.location || '-'}
                            </span>
                          </div>
                        ) : (
                          <div className="overflow-hidden">
                            {company.location ? (
                              <>
                                <p className="text-gray-700 text-sm truncate" title={company.location.split(',')[0]}>{company.location.split(',')[0] || '-'}</p>
                                {company.location.split(',').length > 1 && (
                                  <p className="text-gray-500 text-xs mt-1 truncate" title={company.location.split(',').slice(1).join(',').trim()}>
                                    {company.location.split(',').slice(1).join(',').trim()}
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-700 text-sm">-</span>
                            )}
                          </div>
                        )}
                      </td>
                      {/* Website Column */}
                      <td className="px-4 py-4" style={{ width: '160px', overflow: 'hidden' }}>
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-full overflow-hidden">
                          <Lock className="text-gray-500 flex-shrink-0" size={14} />
                          <span className="text-gray-400 blur-[4px] select-none pointer-events-none text-xs truncate min-w-0 flex-1">{company.website || '-'}</span>
                        </div>
                      </td>
                      {/* Revenue Column */}
                      <td className="px-4 py-4" style={{ width: '160px', overflow: 'hidden' }}>
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-full overflow-hidden">
                          <Lock className="text-gray-500 flex-shrink-0" size={14} />
                          <span className="text-gray-400 blur-[4px] select-none pointer-events-none text-xs truncate min-w-0 flex-1">{company.revenue || '-'}</span>
                        </div>
                      </td>
                      {/* Employee Size Column */}
                      <td className="px-4 py-4" style={{ width: '160px', overflow: 'hidden' }}>
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-full overflow-hidden">
                          <Lock className="text-gray-500 flex-shrink-0" size={14} />
                          <span className="text-gray-400 blur-[4px] select-none pointer-events-none text-xs truncate min-w-0 flex-1">{company.employeeSize || '-'}</span>
                        </div>
                      </td>
                      {/* Industry Column */}
                      <td className="px-4 py-4" style={{ width: '160px', overflow: 'hidden' }}>
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-full overflow-hidden">
                          <Lock className="text-gray-500 flex-shrink-0" size={14} />
                          <span className="text-gray-400 blur-[4px] select-none pointer-events-none text-xs truncate min-w-0 flex-1">{company.industry || '-'}</span>
                        </div>
                      </td>
                      {/* Technology Column */}
                      <td className="px-4 py-4" style={{ width: '160px', overflow: 'hidden' }}>
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-full overflow-hidden">
                          <Lock className="text-gray-500 flex-shrink-0" size={14} />
                          <span className="text-gray-400 blur-[4px] select-none pointer-events-none text-xs truncate min-w-0 flex-1">{company.technology || '-'}</span>
                        </div>
                      </td>
                      {/* Actions Column */}
                      <td className="px-4 py-4" style={{ width: '160px', overflow: 'hidden' }}>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-3 rounded-xl bg-gray-200 text-gray-500 cursor-not-allowed flex-shrink-0"
                            disabled
                            title="Locked"
                          >
                            <Lock size={16} />
                          </button>
                          <button
                            className="p-3 border-2 border-gray-200 rounded-xl hover:border-[#2563EB] hover:bg-orange-50 transition-all hover:scale-105 flex-shrink-0"
                            title="View Details"
                          >
                            <Eye size={16} className="text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:hidden space-y-4">
          {isLoading ? (
            [...Array(4)].map((_, index) => (
              <div key={`companies-mobile-skeleton-${index}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                  <Skeleton className="h-4 w-4 rounded flex-shrink-0 mt-1" />
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <Skeleton className="h-12 flex-1 rounded-xl" />
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : (
            visibleCompanies.map((company: { id: string; _id?: string; companyName: string; companyLocation: string; phone: string; location: string; website: string; revenue: string; employeeSize: string; industry: string; technology: string }, index: number) => (
              <div
                key={company.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all"
                style={{ animation: `slideUp 0.3s ease-out ${index * 0.05}s both` }}
              >
                <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="mt-1 flex-shrink-0" onClick={(e: any) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedCompanies.includes(company.id)}
                      onCheckedChange={(checked: boolean) => {
                        // Multiple selection: toggle company
                        if (checked) {
                          setSelectedCompanies([...selectedCompanies, company.id]);
                        } else {
                          setSelectedCompanies(selectedCompanies.filter((id: string) => id !== company.id));
                        }
                      }}
                    />
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-from-[#2563EB] to-[#EB432F] flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#030000] truncate mb-1">{company.companyName}</h3>
                    <p className="text-gray-600 text-sm truncate">{company.companyLocation || '-'}</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="text-blue-600 w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-[#030000] text-sm">{company.location || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <BarChart className="text-emerald-600 w-4 h-4 blur-[4px]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Revenue / Employee Size</p>
                      <p className="text-gray-400 blur-[4px] select-none text-sm">{company.revenue || '-'}</p>
                      <p className="text-gray-400 blur-[4px] select-none text-xs mt-1">{company.employeeSize || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <button
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
                    disabled
                  >
                    Upgrade to Download
                  </button>
                  <button className="h-12 w-12 rounded-xl border-2 border-gray-200 flex items-center justify-center cursor-not-allowed" disabled>
                    <Eye size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>


        {/* Unlock & Download Banner - Sticky at Bottom */}
        {!ableToBuyCompanies && !error && (
          <div className="sticky bottom-0 z-50 mt-8">
            <div className="bg-gradient-to-r from-[#FFF3EC] to-[#FFE8DC] border-2 border-[#2563EB] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#EB432F] flex items-center justify-center shadow-lg flex-shrink-0">
                    <Lock className="text-white" size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[#030000] font-semibold mb-1 text-lg">You've reached your 10 free companies</h3>
                    <p className="text-gray-700 text-sm">Upgrade now to unlock full company details and access our complete database of {pagination?.totalCount || 11}+ companies</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (selectedCompanies.length === 10 && !appliedFilters.limitFilter) {
                      setShowPaymentModal(true);
                    }
                  }}
                  disabled={selectedCompanies.length !== 10 || !!appliedFilters.limitFilter}
                  className={`group px-8 py-4 rounded-xl transition-all flex items-center gap-3 shadow-lg whitespace-nowrap flex-shrink-0 font-medium ${selectedCompanies.length === 10 && !appliedFilters.limitFilter
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#EB432F] text-white hover:shadow-2xl hover:scale-105 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                    }`}
                >
                  <span>Unlock & Download Companies</span>
                  <svg className={`w-5 h-5 transition-transform ${selectedCompanies.length === 10 && !appliedFilters.limitFilter ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Buy Companies Banner - When ableToBuyCompanies is true */}
        {ableToBuyCompanies && !error && (
          <div className="sticky bottom-0 z-50 mt-8">
            <div className="bg-gradient-to-r from-[#FFF3EC] to-[#FFE8DC] border-2 border-[#2563EB] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#EB432F] flex items-center justify-center shadow-lg flex-shrink-0">
                    <Lock className="text-white" size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[#030000] font-semibold mb-1 text-lg">If you want more companies then download first 10 companies</h3>
                    <p className="text-gray-700 text-sm">Upgrade now to unlock full company details and access our complete database of {pagination?.totalCount || 11}+ companies</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (selectedCompanies.length > 0) {
                      setShowPaymentModal(true);
                    }
                  }}
                  disabled={selectedCompanies.length === 0}
                  className={`group px-8 py-4 rounded-xl transition-all flex items-center gap-3 shadow-lg whitespace-nowrap flex-shrink-0 font-medium ${selectedCompanies.length > 0
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#EB432F] text-white hover:shadow-2xl hover:scale-105 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                    }`}
                >
                  <span>Buy Companies</span>
                  <svg className={`w-5 h-5 transition-transform ${selectedCompanies.length > 0 ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              Payment for Companies
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
                    <p className="text-gray-700 font-medium">Selected Companies</p>
                    <p className="text-sm text-gray-500">{selectedCompanies.length} companies</p>
                  </div>
                  <span className="text-gray-700 font-medium">{selectedCompanies.length}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <p className="text-gray-700 font-medium">Price per Company</p>
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
                      {selectedCompanies.length} companies × ${PRICE_PER_CONTACT.toFixed(2)}
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
                type="companies"
                itemIds={selectedCompanies.map((id: string) => {
                  const company = transformedCompanies.find((c: { id: string; _id?: string }) => c.id === id);
                  return company?._id || id;
                })}
                itemCount={selectedCompanies.length}
                pricePerItem={PRICE_PER_CONTACT}
                onSuccess={async (paymentData) => {
                  setPaymentSuccess(true);
                  setPaymentError(null);
                  // File is saved and can be accessed from My Downloads page
                  // Redirect to downloads tab after successful payment
                  setActiveTab('downloads');
                  // Refresh user data to get updated ableToBuyCompanies flag
                  try {
                    const response = await privateApiCall<{ customer: any }>('/customers/setting/profile');
                    if (response.customer) {
                      dispatch(updateUser({
                        ableToBuyContacts: response.customer.ableToBuyContacts || false,
                        ableToBuyCompanies: response.customer.ableToBuyCompanies || false,
                      }));
                      // Refetch companies to show all data if ableToBuyCompanies is now true
                      if (response.customer.ableToBuyCompanies) {
                        const params: GetCustomerCompaniesParams = {
                          page: currentPage,
                          limit: limit,
                          limitFilter: '10000', // Fetch all companies
                        };
                        if (appliedFilters.search) params.search = appliedFilters.search;
                        if (appliedFilters.company) params.company = appliedFilters.company;
                        if (appliedFilters.industry) params.industry = appliedFilters.industry;
                        if (appliedFilters.country) params.country = appliedFilters.country;
                        if (appliedFilters.employeeSize) params.employeeSize = appliedFilters.employeeSize;
                        if (appliedFilters.revenue) params.revenue = appliedFilters.revenue;
                        dispatch(getCustomerCompanies({ ...params, background: false }));
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
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
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

        .button-enabled {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .button-enabled:hover {
          box-shadow: 0 10px 25px rgba(239, 128, 55, 0.3);
          transform: translateY(-1px) scale(1.02);
        }

        .button-disabled {
          transition: opacity 0.3s ease;
        }
      `}</style>
    </div>
  );
}
