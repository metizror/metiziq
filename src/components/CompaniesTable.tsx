import React, { useState, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Skeleton } from './ui/skeleton';
import { Plus, Edit, Trash2, Download, Search, Eye, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, MoreVertical, Building2, Filter } from 'lucide-react';
import { Company, User } from '@/types/dashboard.types';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteCompanies, getCompanies, type GetCompaniesParams } from '@/store/slices/companies.slice';
import { privateApiCall } from '@/lib/api';

interface CompaniesTableProps {
  companies: Company[];
  user: User;
  filters?: any;
  searchQuery?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  isLoading?: boolean;
  error?: string | null;
  onSearchChange?: (search: string) => void;
  onFilterChange?: (filters: any) => void;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onViewCompany?: (company: Company) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

type SortField = keyof Company;
type SortDirection = 'asc' | 'desc';

// Helper function to get avatar color based on company name
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
    'bg-gradient-to-br from-orange-400 to-orange-600',
    'bg-gradient-to-br from-teal-400 to-teal-600',
    'bg-gradient-to-br from-indigo-400 to-indigo-600',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Helper function to get initials
const getInitials = (name: string) => {
  return name.substring(0, 2).toUpperCase();
};

// Industry and Sub-Industry mapping (same as ContactsTable)
const industrySubIndustryMap: Record<string, string[]> = {
  "Agriculture, Forestry and Fishing": [
    "Commercial Fishing",
    "Crop and Animal Production",
    "Forestry and Logging"
  ],
  "Aerospace and Defense": [
    "Aircraft Engine and Parts Manufacturing",
    "Aircraft Manufacturing",
    "Guided Missile and Space Vehicle Manufacturing",
    "Space Research and Technology",
    "Weapons and Ammunition Manufacturing"
  ],
  "Automotive, Transportation and Logistics": [
    "Air Transportation Services",
    "Airlines",
    "Mass Transit and Ground Passenger Transportation",
    "Miscellaneous Transportation Equipment Manufacturing",
    "Miscellaneous Transportation Services",
    "Motor Vehicle and Parts Dealers",
    "Motor Vehicle Manufacturing",
    "Motor Vehicle Parts Manufacturing",
    "Motor Vehicle Rental",
    "Motor Vehicle Repair and Maintenance",
    "Motor Vehicle Wholesale",
    "Pipeline Transportation",
    "Postal, Shipping and Messengers",
    "Railroad Transport",
    "Railroad Transportation Services",
    "Road Transportation Services",
    "Ship and Boat Building",
    "Shipping and Water Transport",
    "Shipping and Water Transportation Services",
    "Storage and Warehousing",
    "Train and Railroad Equipment Manufacturing",
    "Transportation Equipment Wholesale",
    "Trucking"
  ],
  "Banking and Finance": [
    "Banking",
    "Commodities",
    "Exchanges",
    "Holding Companies",
    "Investment Banking",
    "Investment Services",
    "Mortgage and Credit",
    "Securities"
  ],
  "Business, Consulting and Professional Services": [
    "Administrative Services",
    "Advertising Services",
    "Associations and Organizations",
    "Building and Dwelling Services",
    "Business Support Services",
    "Commercial Real Estate Leasing",
    "Consulting Services",
    "Employment Services",
    "Facilities Management",
    "Market Research and Opinion Polling",
    "Miscellaneous Professional Services",
    "Photographic Services",
    "Research and Development Services",
    "Accounting and Tax Preparation",
    "Architecture and Engineering",
    "Investigation and Security Services",
    "Legal Services",
    "Specialized Design Services",
    "Marketing Services",
    "Industrial Machinery Repair and Maintenance",
    "Miscellaneous Repair and Maintenance",
    "Computer and Office Machine Repair and Maintenance"
  ],
  "Chemicals": [
    "Agricultural Chemical Manufacturing",
    "Basic Chemical Manufacturing",
    "Chemical Wholesale",
    "Miscellaneous Chemical Manufacturing",
    "Paint, Coating, and Adhesive Manufacturing",
    "Synthetic Chemical Manufacturing"
  ],
  "Construction and Building Materials": [
    "Cement and Concrete Product Manufacturing",
    "Civil Engineering",
    "Construction and Hardware Materials Wholesale",
    "Construction Machinery Manufacturing",
    "Residential and Commercial Building Construction",
    "Specialty Construction Trade Contractors"
  ],
  "Consumer Services": [
    "Consumer Goods Rental",
    "Death Care Services",
    "Fitness and Recreation Centers",
    "Laundry Services",
    "Miscellaneous Personal Services",
    "Personal Care Services",
    "Photofinishing",
    "Residential Real Estate Leasing"
  ],
  "Education": [
    "Child Day Care Services",
    "Colleges and Universities",
    "Miscellaneous Educational Services",
    "Primary and Secondary Education",
    "Professional and Management Training"
  ],
  "Electronics": [
    "Appliance Repair and Maintenance",
    "Audio and Video Equipment Manufacturing",
    "Consumer Electronics Repair and Maintenance",
    "Electrical Equipment and Appliances Manufacturing",
    "Electromedical and Control Instruments Manufacturing",
    "Electronic Equipment Repair and Maintenance",
    "Electronics and Appliances Stores",
    "Electronics Wholesale",
    "Magnetic and Optical Media Manufacturing",
    "Semiconductor and Other Electronic Component Manufacturing"
  ],
  "Entertainment, Travel and Leisure": [
    "Airlines",
    "Fitness and Recreation Centers",
    "Gambling and Casinos",
    "Golf Courses and Country Clubs",
    "Hotels and Accommodation",
    "Miscellaneous Amusement and Recreation",
    "Museums and Historical Sites",
    "Performing Arts",
    "Promoters and Agents",
    "Restaurants and Bars",
    "Spectator Sports",
    "Sporting Goods and Recreation Stores",
    "Travel and Reservation Services"
  ],
  "Food and Beverage": [
    "Alcoholic Beverage Wholesale",
    "Beer, Wine, and Liquor Stores",
    "Beverage Manufacturing",
    "Commercial Fishing",
    "Crop and Animal Production",
    "Food Manufacturing",
    "Grocery Stores",
    "Grocery Wholesale",
    "Restaurants and Bars"
  ],
  "Healthcare, Biotechnology and Pharmaceuticals": [
    "Ambulatory Services",
    "Dentists",
    "Diagnostic Laboratories",
    "Fitness and Recreation Centers",
    "Health and Personal Care Wholesale",
    "Home Health Care Services",
    "Hospitals",
    "Medical Equipment and Supplies",
    "Nursing and Residential Care",
    "Outpatient Care",
    "Pharmaceutical Manufacturing",
    "Pharmacies and Personal Care Stores",
    "Physicians and Health Practitioners",
    "Social and Rehabilitation Services"
  ],
  "High Tech": [
    "Communications Equipment Manufacturing",
    "Computer and Peripheral Equipment Manufacturing",
    "Computer Programming",
    "Computer System Design Services",
    "Data Processing",
    "Electrical Equipment and Appliances Manufacturing",
    "Electromedical and Control Instruments Manufacturing",
    "Software",
    "Internet and Web Services",
    "Managed Service Providers (MSPs)"
  ],
  "Insurance": [
    "Insurance Agents",
    "Insurance Services",
    "Life and Health Insurance",
    "Pensions and Funds",
    "Property and Casualty Insurance"
  ],
  "Manufacturing": [
    "Agricultural Chemical Manufacturing",
    "Aircraft Engine and Parts Manufacturing",
    "Aircraft Manufacturing",
    "Audio and Video Equipment Manufacturing",
    "Basic Chemical Manufacturing",
    "Beverage Manufacturing",
    "Cement and Concrete Product Manufacturing",
    "Clothing and Apparel Manufacturing",
    "Communications Equipment Manufacturing",
    "Computer and Peripheral Equipment Manufacturing",
    "Construction Machinery Manufacturing",
    "Electrical Equipment and Appliances Manufacturing",
    "Electromedical and Control Instruments Manufacturing",
    "Food Manufacturing",
    "Furniture Manufacturing",
    "Guided Missile and Space Vehicle Manufacturing",
    "Machinery and Equipment Manufacturing",
    "Magnetic and Optical Media Manufacturing",
    "Metal Products Manufacturing",
    "Miscellaneous Chemical Manufacturing",
    "Miscellaneous Manufacturing",
    "Miscellaneous Transportation Equipment Manufacturing",
    "Motor Vehicle Manufacturing",
    "Motor Vehicle Parts Manufacturing",
    "NonMetallic Mineral Product Manufacturing",
    "Paint, Coating, and Adhesive Manufacturing",
    "Paper Product Manufacturing",
    "Petroleum Product Manufacturing",
    "Pharmaceutical Manufacturing",
    "Rubber and Plastic Product Manufacturing",
    "Semiconductor and Other Electronic Component Manufacturing",
    "Ship and Boat Building",
    "Synthetic Chemical Manufacturing",
    "Textile Manufacturing",
    "Tobacco Production",
    "Train and Railroad Equipment Manufacturing",
    "Weapons and Ammunition Manufacturing",
    "Wood Product Manufacturing"
  ],
  "Mining, Quarrying and Drilling": [
    "Coal Mining",
    "Metals Mining",
    "NonMetallic Minerals Mining",
    "Petroleum and Natural Gas Extraction",
    "Support Activities for Mining"
  ],
  "Non-Profit": [
    "Non-profit Organisations"
  ],
  "Government Administration": [
    "Administration of Public Programs",
    "Courts, Justice and Public Safety",
    "Executive and Legislature",
    "National Security and International Affairs",
    "Space Research and Technology",
    "Local Authorities (Cities, Counties, States)"
  ],
  "Real Estate": [
    "Commercial Real Estate Leasing",
    "Property Managers",
    "Real Estate Agents and Brokers",
    "Real Estate Services",
    "Residential Real Estate Leasing"
  ],
  "Rental and Leasing": [
    "Commercial and Industrial Rental",
    "Commercial Real Estate Leasing",
    "Consumer Goods Rental",
    "Miscellaneous Rental",
    "Motor Vehicle Rental",
    "Residential Real Estate Leasing"
  ],
  "Retail": [
    "Beer, Wine, and Liquor Stores",
    "Clothing and Apparel Stores",
    "Department Stores",
    "Electronics and Appliances Stores",
    "Gasoline Stations and Fuel Dealers",
    "Grocery Stores",
    "Home and Garden Retail",
    "Home Furnishings Retail",
    "Miscellaneous Store Retailers",
    "Motor Vehicle and Parts Dealers",
    "Nonstore Retail",
    "Pharmacies and Personal Care Stores",
    "Sporting Goods and Recreation Stores",
    "Convenience Store",
    "eCommerce"
  ],
  "Telecommunications and Publishing": [
    "Broadcasting and Media",
    "Cable and Other Program Distribution",
    "Communication Equipment Repair and Maintenance",
    "Communications Equipment Manufacturing",
    "Internet and Web Services",
    "Miscellaneous Information Services",
    "Miscellaneous Telecommunication Services",
    "Movies",
    "Publishing",
    "Telecommunications Resellers",
    "Wired Telecommunications Carriers",
    "Wireless Telecommunications Carriers",
    "Music",
    "Printing"
  ],
  "Utilities and Energy": [
    "Electricity Generation and Distribution",
    "Natural Gas Distribution",
    "Waste Management",
    "Water and Sewage Services",
    "Renweable Energy Services",
    "Petroleum and Natural Gas Extraction"
  ],
  "Wholesale": [
    "Alcoholic Beverage Wholesale",
    "Chemical Wholesale",
    "Clothing and Apparel Wholesale",
    "Computer, Office Equipment and Software Merchant Wholesalers",
    "Construction and Hardware Materials Wholesale",
    "Electronics Wholesale",
    "Grocery Wholesale",
    "Health and Personal Care Wholesale",
    "Home Furnishings Wholesale",
    "Machinery Wholesale",
    "Metals and Minerals Wholesale",
    "Miscellaneous Wholesale",
    "Motor Vehicle Wholesale",
    "Paper Wholesale",
    "Petroleum Wholesale",
    "Professional and Commercial Equipment Wholesale",
    "Transportation Equipment Wholesale"
  ]
};

const industries = [
  ...Object.keys(industrySubIndustryMap).map(industry => ({
    label: industry,
    value: industry,
  })),
  { label: 'Other', value: 'Other' }
];

// Helper function to format revenue with $ sign
const formatRevenue = (revenue: string | undefined | null): string => {
  if (!revenue || revenue === '-') return '-';
  
  // If already has $ sign, return as is
  if (revenue.includes('$')) return revenue;
  
  // Map revenue values to formatted strings
  const revenueMap: { [key: string]: string } = {
    'Lessthan1M': 'Less than $1M',
    '1Mto5M': '$1M-$5M',
    '5Mto10M': '$5M-$10M',
    '10Mto50M': '$10M-$50M',
    '50Mto100M': '$50M-$100M',
    '100Mto250M': '$100M-$250M',
    '250Mto500M': '$250M-$500M',
    '500Mto1B': '$500M-$1B',
    'Morethan1B': 'More than $1B',
  };
  
  // Check if it's a known format
  if (revenueMap[revenue]) {
    return revenueMap[revenue];
  }
  
  // If it's in format like "1Mto5M" or "1M-5M", add $ signs
  const rangeMatch = revenue.match(/^(\d+(?:\.\d+)?[MB]?)to(\d+(?:\.\d+)?[MB]?)$/i) || revenue.match(/^(\d+(?:\.\d+)?[MB]?)-(\d+(?:\.\d+)?[MB]?)$/i);
  if (rangeMatch) {
    return `$${rangeMatch[1]}-$${rangeMatch[2]}`;
  }
  
  // If it starts with a number and M/B, add $ sign
  const singleMatch = revenue.match(/^(\d+(?:\.\d+)?)([MB])$/i);
  if (singleMatch) {
    return `$${singleMatch[1]}${singleMatch[2]}`;
  }
  
  // Default: return as is
  return revenue;
};

// Helper function to format employee size for display (add spaces)
const formatEmployeeSize = (employeeSize: string | undefined | null): string => {
  if (!employeeSize || employeeSize === '-') return '-';
  
  // Map employee size values to formatted strings with spaces
  const employeeSizeMap: { [key: string]: string } = {
    '1to25': '1 to 25',
    '26to50': '26 to 50',
    '51to100': '51 to 100',
    '101to250': '101 to 250',
    '251to500': '251 to 500',
    '501to1000': '501 to 1000',
    '1001to2500': '1001 to 2500',
    '2501to5000': '2501 to 5000',
    '5001to10000': '5001 to 10000',
    'over10001': 'over 10,001',
  };
  
  // Check if it's a known format
  if (employeeSizeMap[employeeSize]) {
    return employeeSizeMap[employeeSize];
  }
  
  // If it's in format like "51to100", add spaces
  const rangeMatch = employeeSize.match(/^(\d+)to(\d+)$/i);
  if (rangeMatch) {
    return `${rangeMatch[1]} to ${rangeMatch[2]}`;
  }
  
  // If it starts with "over", format it
  const overMatch = employeeSize.match(/^over(\d+)$/i);
  if (overMatch) {
    const num = parseInt(overMatch[1]);
    if (num >= 1000) {
      return `over ${num.toLocaleString()}`;
    }
    return `over ${overMatch[1]}`;
  }
  
  // Default: return as is
  return employeeSize;
};

export function CompaniesTable({ 
  companies, 
  user, 
  filters = {}, 
  searchQuery = '',
  pagination = null,
  isLoading = false,
  error = null,
  onSearchChange,
  onFilterChange,
  onPageChange,
  onLimitChange,
  onViewCompany,
  showFilters = false,
  onToggleFilters
}: CompaniesTableProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isDeleting } = useAppSelector((state) => state.companies);
  const [isPending, startTransition] = useTransition();
  const [selectedCompanies, setSelectedCompanies] = useState([] as string[]);
  const [sortField, setSortField] = useState('companyName' as SortField);
  const [sortDirection, setSortDirection] = useState('asc' as SortDirection);
  const [showExportAllDialog, setShowExportAllDialog] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);

  // Optimistic state for companies
  const [optimisticCompanies, setOptimisticCompanies] = useOptimistic(
    companies,
    (currentCompanies: Company[], action: {
      type: 'update' | 'delete';
      companyId: string;
      updatedCompany?: Company;
    }) => {
      if (action.type === 'delete') {
        return currentCompanies.filter(c => {
          const cId = c.id || (c as any)._id;
          return cId !== action.companyId;
        });
      }
      if (action.type === 'update' && action.updatedCompany) {
        return currentCompanies.map(c => {
          const cId = c.id || (c as any)._id;
          const updatedId = action.updatedCompany!.id || (action.updatedCompany as any)._id;
          return cId === updatedId ? action.updatedCompany! : c;
        });
      }
      return currentCompanies;
    }
  );

  // Use pagination from API or default values
  const currentPage = pagination?.currentPage || 1;
  const rowsPerPage = pagination?.limit || 25;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.totalCount || 0;
  
  // Use optimistic companies for display (immediate UI updates)
  const displayedCompanies = optimisticCompanies;
  const startIndex = pagination ? (pagination.currentPage - 1) * pagination.limit : 0;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1" /> : 
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  // Handle page navigation
  const handlePageNavigation = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  // Handle limit change
  const handleRowsPerPageChange = (value: string) => {
    const limit = parseInt(value, 10);
    if (onLimitChange) {
      onLimitChange(limit);
    }
  };

  // Validation functions
  const validatePhone = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true; // Optional field
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    // Phone should have 10-15 digits (allowing international formats)
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  const validateWebsite = (website: string): boolean => {
    if (!website || website.trim() === '') return true; // Optional field
    try {
      // Add protocol if missing
      let urlToValidate = website.trim();
      if (!urlToValidate.match(/^https?:\/\//i)) {
        urlToValidate = 'https://' + urlToValidate;
      }
      const url = new URL(urlToValidate);
      // Check if it's http or https
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleEditCompany = (company: Company) => {
    const companyId = company.id || (company as any)._id;
    if (companyId) {
      router.push(`/companies/edit/${companyId}`);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!companyId) {
      toast.error('Company ID is missing');
      return;
    }

    // Find the company to restore if deletion fails
    const companyToDelete = companies.find(c => {
      const cId = c.id || (c as any)._id;
      return cId === companyId;
    });

    // Optimistically remove from UI immediately
    startTransition(() => {
      setOptimisticCompanies({ type: 'delete', companyId });
    });

    // Clear selection if this company was selected
    setSelectedCompanies(selectedCompanies.filter((selectedId: string) => selectedId !== companyId));

    try {
      // Dispatch deleteCompanies action - company is already removed optimistically in Redux
      await dispatch(deleteCompanies({ ids: [companyId] })).unwrap();

      toast.success('Company deleted successfully');
      
      // No need to refetch - company is already removed from Redux state optimistically
    } catch (error: any) {
      // Error occurred - need to restore the company
      // Since Redux already removed it optimistically, we need to add it back
      if (companyToDelete) {
        // Dispatch a background refresh to restore the company
        const fetchParams: GetCompaniesParams = {
          ...filters,
          page: pagination?.currentPage || 1,
          search: searchQuery || undefined,
        };
        const cleanedFilters = Object.fromEntries(
          Object.entries(fetchParams).filter(([_, value]) => {
            if (typeof value === 'number') return true;
            return value !== '' && value !== null && value !== undefined;
          })
        ) as GetCompaniesParams;
        // Refetch to restore the company that failed to delete
        await dispatch(getCompanies(cleanedFilters));
      }
      toast.error(error.message || 'Failed to delete company');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCompanies.length === 0) {
      toast.error('Please select companies to delete');
      return;
    }

    // Store count before clearing
    const countToDelete = selectedCompanies.length;
    const idsToDelete = [...selectedCompanies];

    // Find companies to restore if deletion fails
    const companiesToDelete = companies.filter(c => {
      const cId = c.id || (c as any)._id;
      return idsToDelete.includes(cId);
    });

    // Optimistically remove all selected companies from UI immediately
    startTransition(() => {
      idsToDelete.forEach(companyId => {
        setOptimisticCompanies({ type: 'delete', companyId });
      });
    });

    // Clear selection immediately
    setSelectedCompanies([]);

    try {
      // Dispatch deleteCompanies action
      await dispatch(deleteCompanies({ ids: idsToDelete })).unwrap();
      toast.success(`${countToDelete} companies deleted successfully`);
      
      // No need to refetch - companies are already removed from Redux state optimistically
    } catch (error: any) {
      // Error occurred - need to restore the companies
      // Since Redux already removed them optimistically, we need to add them back
      if (companiesToDelete.length > 0) {
        // Dispatch a background refresh to restore the companies
        const fetchParams: GetCompaniesParams = {
          ...filters,
          page: pagination?.currentPage || 1,
          search: searchQuery || undefined,
        };
        const cleanedFilters = Object.fromEntries(
          Object.entries(fetchParams).filter(([_, value]) => {
            if (typeof value === 'number') return true;
            return value !== '' && value !== null && value !== undefined;
          })
        ) as GetCompaniesParams;
        // Refetch to restore the companies that failed to delete
        await dispatch(getCompanies(cleanedFilters));
      }
      // Restore selection
      setSelectedCompanies(idsToDelete);
      toast.error(error.message || 'Failed to delete companies');
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

  const handleExportSingle = (company: Company) => {
    const companyData = company as any;
    const csvHeader = 'Company ID,Company Name,Phone,Address 1,Address 2,City,State,Zip Code,Country,Website,Revenue,Employee Size,Industry,Sub-Industry,Technology,Company LinkedIn URL,aMF Notes,Created By,Added Date,Last Update Date,Updated Date';
    const csvRow = [
      escapeCSV(company.id || companyData._id || ''),
      escapeCSV(company.companyName || ''),
      escapeCSV(company.phone || ''),
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
    downloadCSV(csvContent, `company-${company.companyName.replace(/\s+/g, '-').toLowerCase()}.csv`);
  };

  const handleExportBulk = () => {
    if (selectedCompanies.length > 0) {
      const companiesToExport = companies.filter(company => selectedCompanies.includes(company.id));
      exportCompaniesToCSV(companiesToExport, `companies-export-${companiesToExport.length}.csv`);
      toast.success(`${companiesToExport.length} companies exported successfully`);
      return;
    }

    // If no selection, show confirmation dialog for "Export All"
    // The AlertDialogTrigger will handle opening the dialog
  };

  const handleConfirmExportAll = async () => {
    try {
      setIsExportingAll(true);
      setShowExportAllDialog(false);

      // Fetch all companies from API
      const allCompanies: Company[] = [];
      let page = 1;
      const limit = 100; // API max limit
      let hasMore = true;

      while (hasMore) {
        // Build query string for direct API call
        const queryParts: string[] = [];
        queryParts.push(`page=${page}`);
        queryParts.push(`limit=${limit}`);
        
        // Add filter parameters (excluding search to get all companies)
        if (filters.companyName) queryParts.push(`companyName=${encodeURIComponent(filters.companyName)}`);
        if (filters.industry) queryParts.push(`industry=${encodeURIComponent(filters.industry)}`);
        if (filters.country) queryParts.push(`country=${encodeURIComponent(filters.country)}`);
        if (filters.state) queryParts.push(`state=${encodeURIComponent(filters.state)}`);
        if (filters.revenue) queryParts.push(`revenue=${encodeURIComponent(filters.revenue)}`);
        if (filters.employeeSize) queryParts.push(`employeeSize=${encodeURIComponent(filters.employeeSize)}`);

        const queryString = queryParts.join('&');
        const endpoint = `/admin/companies${queryString ? `?${queryString}` : ''}`;

        // Use direct API call instead of Redux to avoid triggering loader
        const response = await privateApiCall<{
          companies: any[];
          pagination: {
            currentPage: number;
            totalPages: number;
            totalCount: number;
            limit: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
          };
        }>(endpoint);
        
        // Map companies to ensure they have 'id' field
        const mappedCompanies = response.companies.map((company: any) => ({
          ...company,
          id: company._id || company.id,
        }));
        
        allCompanies.push(...mappedCompanies);

        // Check if there are more pages
        if (page >= response.pagination.totalPages) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // Export all companies
      exportCompaniesToCSV(allCompanies, `all-companies-export-${allCompanies.length}.csv`);
      toast.success(`${allCompanies.length} companies exported successfully`);
    } catch (error: any) {
      console.error('Export all failed:', error);
      toast.error(error.message || 'Failed to export all companies');
    } finally {
      setIsExportingAll(false);
    }
  };

  const exportCompaniesToCSV = (companiesToExport: Company[], filename: string) => {
    const csvHeader = 'Company ID,Company Name,Phone,Address 1,Address 2,City,State,Zip Code,Country,Website,Revenue,Employee Size,Industry,Sub-Industry,Technology,Company LinkedIn URL,aMF Notes,Created By,Added Date,Last Update Date,Updated Date';
    const csvRows = companiesToExport.map(company => {
      const companyData = company as any;
      return [
        escapeCSV(company.id || companyData._id || ''),
        escapeCSV(company.companyName || ''),
        escapeCSV(company.phone || ''),
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
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');
    downloadCSV(csvContent, filename);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  return (
    <Card className="h-full flex flex-col overflow-hidden" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>Companies ({totalCount})</CardTitle>
          <div className="flex items-center space-x-2">
            {onToggleFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFilters}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Search Filters
              </Button>
            )}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search companies..."
                value={searchQuery || ''}
                onChange={(e: { target: { value: string } }) => {
                  const value = e.target.value;
                  handleSearchInputChange(value);
                }}
                className="pl-9 h-9"
              />
            </div>
            
            {selectedCompanies.length > 0 && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedCompanies.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Companies</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedCompanies.length} selected companies? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleBulkDelete} 
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button onClick={handleExportBulk} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export ({selectedCompanies.length})
                </Button>
              </>
            )}
            <AlertDialog open={showExportAllDialog} onOpenChange={setShowExportAllDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={isExportingAll || selectedCompanies.length > 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExportingAll ? 'Exporting...' : 'Export All'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Export All Companies</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to export all {totalCount} companies? This may take a moment to fetch all data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isExportingAll}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleConfirmExportAll}
                    disabled={isExportingAll}
                  >
                    {isExportingAll ? 'Exporting...' : 'Export All'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button 
              size="sm" 
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white"
              onClick={() => router.push('/companies/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="overflow-y-auto overflow-x-auto flex-1" style={{ 
          scrollbarWidth: 'thin', 
          scrollbarColor: '#2563EB #f1f1f1',
          minHeight: 0,
          maxHeight: '100%'
        }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedCompanies.length === displayedCompanies.length && displayedCompanies.length > 0}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSelectedCompanies(displayedCompanies.map((company: Company) => company.id));
                      } else {
                        setSelectedCompanies([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('companyName')} className="cursor-pointer">
                  <div className="flex items-center">
                    Company {getSortIcon('companyName')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('industry')} className="cursor-pointer">
                  <div className="flex items-center">
                    Industry {getSortIcon('industry')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('city')} className="cursor-pointer">
                  <div className="flex items-center">
                    Location {getSortIcon('city')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('revenue')} className="cursor-pointer">
                  <div className="flex items-center">
                    Revenue {getSortIcon('revenue')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('employeeSize')} className="cursor-pointer">
                  <div className="flex items-center">
                    Employees {getSortIcon('employeeSize')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('website')} className="cursor-pointer">
                  <div className="flex items-center">
                    Website {getSortIcon('website')}
                  </div>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {[...Array(10)].map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-4 rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-red-600">
                    {error}
                  </TableCell>
                </TableRow>
              ) : displayedCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                displayedCompanies.map((company: Company) => {
                  return (
                <TableRow 
                  key={company.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={(e: any) => {
                    // Don't trigger row click if clicking on interactive elements
                    const target = e.target as HTMLElement;
                    if (!target.closest('button') && !target.closest('[role="checkbox"]') && !target.closest('[role="menuitem"]')) {
                      onViewCompany?.(company);
                    }
                  }}
                >
                  <TableCell onClick={(e: any) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedCompanies.includes(company.id)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedCompanies([...selectedCompanies, company.id]);
                        } else {
                          setSelectedCompanies(selectedCompanies.filter((id: string) => id !== company.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(company.companyName)} flex items-center justify-center flex-shrink-0`}>
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium">{company.companyName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.industry || '-'}</Badge>
                  </TableCell>
                  <TableCell>
                    {company.city || company.state 
                      ? `${company.city || ''}${company.city && company.state ? ', ' : ''}${company.state || ''}`.trim() || '-'
                      : '-'
                    }
                  </TableCell>
                  <TableCell>{formatRevenue(company.revenue)}</TableCell>
                  <TableCell>{formatEmployeeSize(company.employeeSize)}</TableCell>
                  <TableCell className="max-w-xs truncate">{company.website || '-'}</TableCell>
                  <TableCell onClick={(e: any) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewCompany?.(company)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportSingle(company)}>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCompany(company.id)}
                          className="text-red-600"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls - Fixed at bottom */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ flexShrink: 0, flexGrow: 0 }}>
          <div className="flex items-center space-x-2">
            <Label>Rows per page:</Label>
            <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalCount)} of {totalCount} results
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageNavigation(Math.max(currentPage - 1, 1))}
              disabled={!pagination?.hasPreviousPage || currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex space-x-1">
              {(() => {
                const pages: number[] = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else if (currentPage <= 3) {
                  pages.push(1, 2, 3, 4, 5);
                } else if (currentPage >= totalPages - 2) {
                  pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                } else {
                  pages.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
                }

                return pages.map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageNavigation(pageNum)}
                    style={currentPage === pageNum ? { backgroundColor: '#2563EB' } : {}}
                  >
                    {pageNum}
                  </Button>
                ));
              })()}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageNavigation(Math.min(currentPage + 1, totalPages))}
              disabled={!pagination?.hasNextPage || currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>

    </Card>
  );
}
