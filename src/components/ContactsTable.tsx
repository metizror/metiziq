import React, { useState, useMemo, useEffect, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { Plus, Edit, Trash2, Download, Search, Eye, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, MoreVertical, LayoutList, Table2, Filter } from 'lucide-react';
import { Contact, User, Company } from '@/types/dashboard.types';
import { toast } from 'sonner';
import { ContactsListView } from './ContactsListView';
import { CountrySelect } from './CountrySelect';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createContact, updateContact, deleteContacts, getContacts, type GetContactsParams } from '@/store/slices/contacts.slice';
import { privateApiCall } from '@/lib/api';

interface ContactsTableProps {
  contacts: Contact[];
  user: User;
  companies?: Company[];
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
  onViewContact?: (contact: Contact) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

type SortField = keyof Contact;
type SortDirection = 'asc' | 'desc';

export function ContactsTable({ 
  contacts, 
  user, 
  companies = [], 
  filters = {}, 
  searchQuery = '',
  pagination = null,
  isLoading = false,
  error = null,
  onSearchChange,
  onFilterChange,
  onPageChange,
  onLimitChange,
  onViewContact,
  showFilters = false,
  onToggleFilters
}: ContactsTableProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isCreating, isUpdating, isDeleting } = useAppSelector((state) => state.contacts);
  const [isPending, startTransition] = useTransition();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null as Contact | null);
  const [viewingContact, setViewingContact] = useState(null as Contact | null);
  const [selectedContacts, setSelectedContacts] = useState([] as string[]);
  const [sortField, setSortField] = useState('firstName' as SortField);
  const [sortDirection, setSortDirection] = useState('asc' as SortDirection);
  const [viewMode, setViewMode] = useState('table' as 'table' | 'list');
  const [showExportAllDialog, setShowExportAllDialog] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);

  // Industry and Sub-Industry mapping
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
  
  // Use pagination from API or default values
  const currentPage = pagination?.currentPage || 1;
  const rowsPerPage = pagination?.limit || 25;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.totalCount || 0;
  
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    jobLevel: '',
    jobRole: '',
    email: '',
    phone: '',
    directPhone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
    industry: '',
    subIndustry: '',
    contactLinkedInUrl: '',
    amfNotes: '',
    lastUpdateDate: new Date().toISOString().split('T')[0],
    // Required Company Fields
    companyName: '',
    employeeSize: '',
    revenue: ''
  });

  // Helper function to get company name
  const getCompanyName = (contact: Contact) => {
    // First try to use companyName from contact (if API returns it directly)
    if (contact.companyName) {
      return contact.companyName;
    }
    // Fallback to finding in companies array
    if (contact.companyId) {
      const company = companies.find(c => c.id === contact.companyId);
      return company?.companyName || '';
    }
    return '';
  };

  // Helper function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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

  // Optimistic state for contacts
  const [optimisticContacts, setOptimisticContacts] = useOptimistic(
    contacts,
    (currentContacts: Contact[], action: {
      type: 'update' | 'delete';
      contactId: string;
      updatedContact?: Contact;
    }) => {
      if (action.type === 'delete') {
        return currentContacts.filter(c => {
          const cId = c.id || (c as any)._id;
          return cId !== action.contactId;
        });
      }
      if (action.type === 'update' && action.updatedContact) {
        return currentContacts.map(c => {
          const cId = c.id || (c as any)._id;
          const updatedId = action.updatedContact!.id || (action.updatedContact as any)._id;
          return cId === updatedId ? action.updatedContact! : c;
        });
      }
      return currentContacts;
    }
  );

  // Use optimistic contacts for display (immediate UI updates)
  const displayedContacts = optimisticContacts;
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

  const handleAddContact = async () => {
    if (!newContact.firstName || !newContact.lastName) {
      toast.error('Please enter first and last name');
      return;
    }

    // Validate required company fields
    if (!newContact.companyName || !newContact.employeeSize || !newContact.revenue) {
      toast.error('Company Name, Employee Size, and Revenue are required');
      return;
    }

    try {
      // Prepare payload for API
      const payload = {
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        jobTitle: newContact.jobTitle || undefined,
        jobLevel: newContact.jobLevel || undefined,
        jobRole: newContact.jobRole || undefined,
        email: newContact.email || undefined,
        phone: newContact.phone || undefined,
        directPhone: newContact.directPhone || undefined,
        address1: newContact.address1 || undefined,
        address2: newContact.address2 || undefined,
        city: newContact.city || undefined,
        state: newContact.state || undefined,
        zipCode: newContact.zipCode || undefined,
        country: newContact.country || undefined,
        website: newContact.website || undefined,
        industry: newContact.industry || undefined,
        subIndustry: newContact.subIndustry || undefined,
        contactLinkedIn: newContact.contactLinkedInUrl || undefined,
        lastUpdateDate: newContact.lastUpdateDate || undefined,
        companyName: newContact.companyName || undefined,
        employeeSize: newContact.employeeSize || undefined,
        revenue: newContact.revenue || undefined,
        amfNotes: newContact.amfNotes || undefined,
      };

      // Dispatch createContact action - if it succeeds, unwrap() will return the result
      // If it fails, it will throw an error and be caught in the catch block
      await dispatch(createContact(payload)).unwrap();
      
      // If we reach here, the API call was successful
      // Contact is already added optimistically to Redux state
      // Close dialog first
      setIsAddDialogOpen(false);
      
      // Reset form
      resetForm();
      
      // Show success message
      toast.success('Contact added successfully');
      
      // Notify parent to update page to 1 (so new contact is visible)
      if (onPageChange) {
        onPageChange(1);
      }
      
      // No need to refetch - contact is already in Redux state optimistically
      
    } catch (error: any) {
      // Error occurred - show error message
      // Don't close dialog so user can fix and retry
      toast.error(error.message || 'Failed to add contact');
    }
  };

  const resetForm = () => {
    setNewContact({
      firstName: '',
      lastName: '',
      jobTitle: '',
      jobLevel: '',
      jobRole: '',
      email: '',
      phone: '',
      directPhone: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      website: '',
      industry: '',
      subIndustry: '',
      contactLinkedInUrl: '',
      amfNotes: '',
      lastUpdateDate: new Date().toISOString().split('T')[0],
      companyName: '',
      employeeSize: '',
      revenue: ''
    });
  };

  // Sync form when editingContact changes - ensures dropdowns show correct values
  useEffect(() => {
    if (editingContact) {
      // This will be handled by handleEditContact, but this ensures sync
      // The handleEditContact is called when clicking Edit, so this is a backup
    } else {
      // Reset form when dialog closes
      resetForm();
    }
  }, [editingContact]);

  // Helper function to normalize revenue values (convert API format to dropdown format)
  // API format: "$1M to $5M" -> Dropdown value: "1Mto5M" (without $ and with "to")
  const normalizeRevenue = (value: string | undefined): string => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    
    // Valid Revenue options - exact values as they appear in SelectItem (new format with "to")
    const validRevenues = [
      'Lessthan1M', '1Mto5M', '5Mto10M', '10Mto50M', '50Mto100M',
      '100Mto250M', '250Mto500M', '500Mto1B', 'Morethan1B'
    ];
    
    // First check for exact match (case-sensitive) - new format
    const exactMatch = validRevenues.find(rev => rev === trimmed);
    if (exactMatch) return exactMatch;
    
    // Handle old format - convert to new format
    const oldToNewMap: { [key: string]: string } = {
      'Less-than-1M': 'Lessthan1M',
      '1M-5M': '1Mto5M',
      '5M-10M': '5Mto10M',
      '10M-50M': '10Mto50M',
      '50M-100M': '50Mto100M',
      '100M-250M': '100Mto250M',
      '250M-500M': '250Mto500M',
      '500M-1B': '500Mto1B',
      'More-than-1B': 'Morethan1B',
    };
    
    if (oldToNewMap[trimmed]) return oldToNewMap[trimmed];
    
    // Handle special cases - remove $ signs and convert to new format
    if (trimmed === 'Less than $1M' || trimmed.toLowerCase() === 'less than $1m' || trimmed === 'Less-than-$1M') return 'Lessthan1M';
    if (trimmed === 'More than $1B' || trimmed.toLowerCase() === 'more than $1b' || trimmed === 'More-than-$1B') return 'Morethan1B';
    
    // Remove $ signs and replace " to " or "-" with "to"
    let normalized = trimmed.replace(/\$/g, '').replace(/\s+to\s+/gi, 'to').replace(/-/g, 'to');
    
    // Check if normalized value matches any valid option
    const normalizedMatch = validRevenues.find(rev => rev === normalized);
    if (normalizedMatch) return normalizedMatch;
    
    return '';
  };

  // Helper function to normalize employeeSize values (convert API format to dropdown format)
  // API format: "1 to 25" -> Dropdown value: "1to25" (new format with "to")
  const normalizeEmployeeSize = (value: string | undefined): string => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    
    // Valid Employee Size options - exact values as they appear in SelectItem (new format with "to")
    const validSizes = [
      '1to25', '26to50', '51to100', '101to250', '251to500',
      '501to1000', '1001to2500', '2501to5000', '5001to10000', 'over10001'
    ];
    
    // First check for exact match (case-sensitive) - new format
    const exactMatch = validSizes.find(size => size === trimmed);
    if (exactMatch) return exactMatch;
    
    // Handle old format - convert to new format
    const oldToNewMap: { [key: string]: string } = {
      '1-25': '1to25',
      '26-50': '26to50',
      '51-100': '51to100',
      '101-250': '101to250',
      '251-500': '251to500',
      '501-1000': '501to1000',
      '1001-2500': '1001to2500',
      '2501-5000': '2501to5000',
      '5001-10000': '5001to10000',
      'over-10001': 'over10001',
    };
    
    if (oldToNewMap[trimmed]) return oldToNewMap[trimmed];
    
    // Handle special case
    if (trimmed === 'over 10,001' || trimmed.toLowerCase() === 'over 10,001') return 'over10001';
    
    // Remove spaces and replace " to " or "-" with "to"
    let normalized = trimmed.replace(/\s+to\s+/gi, 'to').replace(/-/g, 'to').replace(/\s+/g, '');
    
    // Check if normalized value matches any valid option
    const normalizedMatch = validSizes.find(size => size === normalized);
    if (normalizedMatch) return normalizedMatch;
    
    return '';
  };

  // Helper function to normalize Job Level values (trim and match exact values)
  const normalizeJobLevel = (value: string | undefined): string => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    // Valid Job Level options - exact values as they appear in SelectItem
    const validLevels = [
      'Analyst', 'Below Manager', 'C-Level', 'Developer', 'Director', 
      'Engineer', 'General Manager', 'Manager', 'Managing Director', 
      'Vice President', 'Architect'
    ];
    // Check if trimmed value matches any valid level (case-insensitive)
    const matched = validLevels.find(level => level.toLowerCase() === trimmed.toLowerCase());
    // Always return the exact matched value to ensure SelectItem match
    if (matched) {
      return matched;
    }
    // Check for exact match (handles cases where value is already correct)
    const exactMatch = validLevels.find(level => level === trimmed);
    return exactMatch || '';
  };

  // Helper function to normalize Job Role values (trim and match exact values)
  const normalizeJobRole = (value: string | undefined): string => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    
    // Valid Job Role options - exact values as they appear in SelectItem
    const validRoles = [
      'Administration', 'Business Development', 'Client Management', 
      'Customer Experience', 'Customer Success', 'Data & Analytics', 
      'Demand Generation', 'Engineering', 'Finance', 'Growth', 
      'Human Resources', 'Information Technology', 'Legal', 'Manufacturing', 
      'Marketing', 'Operations', 'Others', 
      'Procurement / Sourcing / Supply Chain', 'Product', 'Quality', 
      'Risk & Compliance', 'Sales', 'Sales & Marketing', 'Strategy', 'Underwriting'
    ];
    
    // First check for exact match (case-sensitive)
    const exactMatch = validRoles.find(role => role === trimmed);
    if (exactMatch) return exactMatch;
    
    // Check for case-insensitive match
    const caseInsensitiveMatch = validRoles.find(role => role.toLowerCase() === trimmed.toLowerCase());
    if (caseInsensitiveMatch) return caseInsensitiveMatch;
    
    // Handle common variations and abbreviations
    const lowerTrimmed = trimmed.toLowerCase();
    
    // Map common variations to exact values
    const variationMap: Record<string, string> = {
      // Engineering variations
      'software engineer': 'Engineering',
      'software engineering': 'Engineering',
      'engineer': 'Engineering',
      'development': 'Engineering',
      'software development': 'Engineering',
      'dev': 'Engineering',
      'programming': 'Engineering',
      'tech': 'Engineering',
      'technical': 'Engineering',
      
      // IT variations
      'it': 'Information Technology',
      'information tech': 'Information Technology',
      'tech support': 'Information Technology',
      'technology': 'Information Technology',
      
      // Sales variations
      'sales manager': 'Sales',
      'sales executive': 'Sales',
      'sales rep': 'Sales',
      'sales representative': 'Sales',
      'account manager': 'Sales',
      
      // Marketing variations
      'marketing manager': 'Marketing',
      'digital marketing': 'Marketing',
      'brand marketing': 'Marketing',
      
      // HR variations
      'hr': 'Human Resources',
      'human resource': 'Human Resources',
      'people operations': 'Human Resources',
      'talent': 'Human Resources',
      
      // Finance variations
      'accounting': 'Finance',
      'financial': 'Finance',
      'accounts': 'Finance',
      
      // Operations variations
      'ops': 'Operations',
      'operational': 'Operations',
      
      // Product variations
      'product management': 'Product',
      'product manager': 'Product',
      'pm': 'Product',
      
      // Data variations
      'data analytics': 'Data & Analytics',
      'data and analytics': 'Data & Analytics',
      'analytics': 'Data & Analytics',
      'data science': 'Data & Analytics',
      
      // Procurement variations
      'procurement': 'Procurement / Sourcing / Supply Chain',
      'sourcing': 'Procurement / Sourcing / Supply Chain',
      'supply chain': 'Procurement / Sourcing / Supply Chain',
      'purchasing': 'Procurement / Sourcing / Supply Chain',
      
      // Customer Success variations
      'customer support': 'Customer Success',
      'customer service': 'Customer Success',
      'cs': 'Customer Success',
      
      // Legal variations
      'legal affairs': 'Legal',
      'compliance': 'Risk & Compliance',
      'risk management': 'Risk & Compliance',
    };
    
    // Check variation map
    if (variationMap[lowerTrimmed]) {
      return variationMap[lowerTrimmed];
    }
    
    // Check if trimmed value contains any valid role (partial match)
    const partialMatch = validRoles.find(role => {
      const lowerRole = role.toLowerCase();
      return lowerTrimmed.includes(lowerRole) || lowerRole.includes(lowerTrimmed);
    });
    if (partialMatch) return partialMatch;
    
    // If still no match, return empty string
    return '';
  };

  // Helper function to normalize Industry values (trim and match exact values)
  const normalizeIndustry = (value: string | undefined, industries: { value: string; label: string }[]): string => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    // Check if trimmed value matches any industry value (case-insensitive)
    const matched = industries.find(industry => 
      industry.value.toLowerCase() === trimmed.toLowerCase() || 
      industry.label.toLowerCase() === trimmed.toLowerCase()
    );
    // Always return the exact matched value to ensure SelectItem match
    if (matched) {
      return matched.value;
    }
    // Check for exact match (handles cases where value is already correct)
    const exactMatch = industries.find(industry => 
      industry.value === trimmed || industry.label === trimmed
    );
    return exactMatch ? exactMatch.value : '';
  };

  const handleEditContact = (contact: Contact) => {
    // Navigate to edit page instead of opening modal
    const contactId = contact.id || (contact as any)._id;
    if (contactId) {
      router.push(`/contacts/edit/${contactId}`);
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact) return;

    // Validate required fields
    if (!newContact.firstName || !newContact.lastName) {
      toast.error('Please enter first and last name');
      return;
    }

    // Validate required company fields
    if (!newContact.companyName || !newContact.employeeSize || !newContact.revenue) {
      toast.error('Company Name, Employee Size, and Revenue are required');
      return;
    }

    // Get contact ID (outside try block so it's accessible in catch)
    const contactId = editingContact.id || (editingContact as any)._id;
    if (!contactId) {
      toast.error('Contact ID is missing');
      return;
    }

    try {
      // Prepare payload for API
      const payload = {
        id: contactId,
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        jobTitle: newContact.jobTitle || undefined,
        jobLevel: newContact.jobLevel || undefined,
        jobRole: newContact.jobRole || undefined,
        email: newContact.email || undefined,
        phone: newContact.phone || undefined,
        directPhone: newContact.directPhone || undefined,
        address1: newContact.address1 || undefined,
        address2: newContact.address2 || undefined,
        city: newContact.city || undefined,
        state: newContact.state || undefined,
        zipCode: newContact.zipCode || undefined,
        country: newContact.country || undefined,
        website: newContact.website || undefined,
        industry: newContact.industry || undefined,
        subIndustry: newContact.subIndustry || undefined,
        contactLinkedIn: newContact.contactLinkedInUrl || undefined,
        lastUpdateDate: newContact.lastUpdateDate || undefined,
        companyName: newContact.companyName || undefined,
        employeeSize: newContact.employeeSize || undefined,
        revenue: newContact.revenue || undefined,
        amfNotes: newContact.amfNotes || undefined,
      };

      // Create optimistic updated contact
      const updatedContact: Contact = {
        ...editingContact,
        ...payload,
        id: contactId,
      };

      // Optimistically update UI immediately
      startTransition(() => {
        setOptimisticContacts({ type: 'update', contactId, updatedContact });
      });

      // Close dialog immediately for better UX
      setEditingContact(null);
      resetForm();

      // Dispatch updateContact action
      const response = await dispatch(updateContact(payload)).unwrap();

      // If we reach here, the API call was successful
      // Show success message
      toast.success('Contact updated successfully');
      
      // The Redux slice will update the specific contact in the list automatically
      // No need to refetch the entire list - this makes it faster and smoother

    } catch (error: any) {
      // Error occurred - rollback optimistic update
      startTransition(() => {
        setOptimisticContacts({ type: 'update', contactId, updatedContact: editingContact });
      });
      // Reopen dialog so user can fix and retry
      setEditingContact(editingContact);
      // Show error message
      toast.error(error.message || 'Failed to update contact');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!contactId) {
      toast.error('Contact ID is missing');
      return;
    }

    // Find the contact to restore if deletion fails
    const contactToDelete = contacts.find(c => {
      const cId = c.id || (c as any)._id;
      return cId === contactId;
    });

    // Optimistically remove from UI immediately
    startTransition(() => {
      setOptimisticContacts({ type: 'delete', contactId });
    });

    // Clear selection if this contact was selected
    setSelectedContacts(selectedContacts.filter((selectedId: string) => selectedId !== contactId));

    try {
      // Dispatch deleteContacts action - contact is already removed optimistically in Redux
      await dispatch(deleteContacts({ ids: [contactId] })).unwrap();

      // Show success message
      toast.success('Contact deleted successfully');
      
      // No need to refetch - contact is already removed from Redux state optimistically
    } catch (error: any) {
      // Error occurred - need to restore the contact
      // Since Redux already removed it optimistically, we need to add it back
      if (contactToDelete) {
        // Dispatch a background refresh to restore the contact
        const fetchParams: GetContactsParams = {
          ...filters,
          page: pagination?.currentPage || 1,
          search: searchQuery || undefined,
        };
        const cleanedFilters = Object.fromEntries(
          Object.entries(fetchParams).filter(([_, value]) => {
            if (typeof value === 'number') return true;
            return value !== '' && value !== null && value !== undefined;
          })
        ) as GetContactsParams;
        // Refetch to restore the contact that failed to delete
        await dispatch(getContacts(cleanedFilters));
      }
      // Show error message
      toast.error(error.message || 'Failed to delete contact');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select contacts to delete');
      return;
    }

    // Store count before clearing
    const countToDelete = selectedContacts.length;
    const idsToDelete = [...selectedContacts];

    // Find contacts to restore if deletion fails
    const contactsToDelete = contacts.filter(c => {
      const cId = c.id || (c as any)._id;
      return idsToDelete.includes(cId);
    });

    // Optimistically remove all selected contacts from UI immediately
    startTransition(() => {
      idsToDelete.forEach(contactId => {
        setOptimisticContacts({ type: 'delete', contactId });
      });
    });

    // Clear selection immediately
    setSelectedContacts([]);

    try {
      // Dispatch deleteContacts action with all selected IDs
      await dispatch(deleteContacts({ ids: idsToDelete })).unwrap();

      // Show success message
      toast.success(`${countToDelete} contacts deleted successfully`);
      
      // No need to refetch - contacts are already removed from Redux state optimistically
    } catch (error: any) {
      // Error occurred - need to restore the contacts
      // Since Redux already removed them optimistically, we need to add them back
      if (contactsToDelete.length > 0) {
        // Dispatch a background refresh to restore the contacts
        const fetchParams: GetContactsParams = {
          ...filters,
          page: pagination?.currentPage || 1,
          search: searchQuery || undefined,
        };
        const cleanedFilters = Object.fromEntries(
          Object.entries(fetchParams).filter(([_, value]) => {
            if (typeof value === 'number') return true;
            return value !== '' && value !== null && value !== undefined;
          })
        ) as GetContactsParams;
        // Refetch to restore the contacts that failed to delete
        await dispatch(getContacts(cleanedFilters));
      }
      // Restore selection
      setSelectedContacts(idsToDelete);
      // Show error message
      toast.error(error.message || 'Failed to delete contacts');
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

  const handleExportSingle = (contact: Contact) => {
    const contactData = contact as any;
    const csvHeader = 'Contact ID,First Name,Last Name,Job Title,Job Level,Job Role,Email,Phone,Direct Phone,Address 1,Address 2,City,State,Zip Code,Country,Website,Industry,Sub-Industry,Contact LinkedIn URL,Company Name,Employee Size,Revenue,aMF Notes,Created By,Added Date,Last Update Date,Updated Date';
    const csvRow = [
      escapeCSV(contact.id || contactData._id || ''),
      escapeCSV(contact.firstName || ''),
      escapeCSV(contact.lastName || ''),
      escapeCSV(contact.jobTitle || ''),
      escapeCSV(contact.jobLevel || ''),
      escapeCSV(contact.jobRole || ''),
      escapeCSV(contact.email || ''),
      escapeCSV(contact.phone || ''),
      escapeCSV(contact.directPhone || ''),
      escapeCSV(contact.address1 || ''),
      escapeCSV(contact.address2 || ''),
      escapeCSV(contact.city || ''),
      escapeCSV(contact.state || ''),
      escapeCSV(contact.zipCode || ''),
      escapeCSV(contact.country || ''),
      escapeCSV(contact.website || ''),
      escapeCSV(contact.industry || ''),
      escapeCSV(contactData.subIndustry || ''),
      escapeCSV(contact.contactLinkedInUrl || contactData.LinkedInUrl || ''),
      escapeCSV(contact.companyName || ''),
      escapeCSV(contact.employeeSize || ''),
      escapeCSV(contact.revenue || ''),
      escapeCSV(contact.amfNotes || ''),
      escapeCSV(contactData.createdBy || contact.addedBy || ''),
      escapeCSV(contact.addedDate || contactData.createdAt || ''),
      escapeCSV(contact.lastUpdateDate || ''),
      escapeCSV(contact.updatedDate || contactData.updatedAt || '')
    ].join(',');
    
    const csvContent = [csvHeader, csvRow].join('\n');
    downloadCSV(csvContent, `contact-${contact.firstName}-${contact.lastName}.csv`);
  };

  const handleExportBulk = () => {
    // If selectedContacts.length > 0, export selected contacts immediately
    if (selectedContacts.length > 0) {
      const contactsToExport = contacts.filter(contact => selectedContacts.includes(contact.id));
      exportContactsToCSV(contactsToExport, `contacts-export-${contactsToExport.length}.csv`);
      toast.success(`${contactsToExport.length} contacts exported successfully`);
      return;
    }

    // If no selection, show confirmation dialog for "Export All"
    // The AlertDialogTrigger will handle opening the dialog
  };

  const handleConfirmExportAll = async () => {
    try {
      setIsExportingAll(true);
      setShowExportAllDialog(false);

      // Fetch all contacts from API
      const allContacts: Contact[] = [];
      let page = 1;
      const limit = 100; // API max limit
      let hasMore = true;

      while (hasMore) {
        // Build query string for direct API call
        const queryParts: string[] = [];
        queryParts.push(`page=${page}`);
        queryParts.push(`limit=${limit}`);
        
        // Add filter parameters (excluding search to get all contacts)
        if (filters.companyName) queryParts.push(`companyName=${encodeURIComponent(filters.companyName)}`);
        if (filters.employeeSize) queryParts.push(`employeeSize=${encodeURIComponent(filters.employeeSize)}`);
        if (filters.revenue) queryParts.push(`revenue=${encodeURIComponent(filters.revenue)}`);
        if (filters.industry) queryParts.push(`industry=${encodeURIComponent(filters.industry)}`);
        if (filters.country) queryParts.push(`country=${encodeURIComponent(filters.country)}`);
        if (filters.state) queryParts.push(`state=${encodeURIComponent(filters.state)}`);
        if (filters.jobTitle) queryParts.push(`jobTitle=${encodeURIComponent(filters.jobTitle)}`);
        if (filters.jobLevel) queryParts.push(`jobLevel=${encodeURIComponent(filters.jobLevel)}`);
        if (filters.jobRole) queryParts.push(`jobRole=${encodeURIComponent(filters.jobRole)}`);

        const queryString = queryParts.join('&');
        const endpoint = `/admin/contacts${queryString ? `?${queryString}` : ''}`;

        // Use direct API call instead of Redux to avoid triggering loader
        const response = await privateApiCall<{
          contacts: any[];
          pagination: {
            currentPage: number;
            totalPages: number;
            totalCount: number;
            limit: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
          };
        }>(endpoint);
        
        // Map contacts to ensure they have 'id' field
        const mappedContacts = response.contacts.map((contact: any) => ({
          ...contact,
          id: contact._id || contact.id,
        }));
        
        allContacts.push(...mappedContacts);

        // Check if there are more pages
        if (page >= response.pagination.totalPages) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // Export all contacts
      exportContactsToCSV(allContacts, `all-contacts-export-${allContacts.length}.csv`);
      toast.success(`${allContacts.length} contacts exported successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export contacts');
    } finally {
      setIsExportingAll(false);
    }
  };

  const exportContactsToCSV = (contactsToExport: Contact[], filename: string) => {
    const csvHeader = 'Contact ID,First Name,Last Name,Job Title,Job Level,Job Role,Email,Phone,Direct Phone,Address 1,Address 2,City,State,Zip Code,Country,Website,Industry,Sub-Industry,Contact LinkedIn URL,Company Name,Employee Size,Revenue,aMF Notes,Created By,Added Date,Last Update Date,Updated Date';
    const csvRows = contactsToExport.map(contact => {
      const contactData = contact as any;
      return [
        escapeCSV(contact.id || contactData._id || ''),
        escapeCSV(contact.firstName || ''),
        escapeCSV(contact.lastName || ''),
        escapeCSV(contact.jobTitle || ''),
        escapeCSV(contact.jobLevel || ''),
        escapeCSV(contact.jobRole || ''),
        escapeCSV(contact.email || ''),
        escapeCSV(contact.phone || ''),
        escapeCSV(contact.directPhone || ''),
        escapeCSV(contact.address1 || ''),
        escapeCSV(contact.address2 || ''),
        escapeCSV(contact.city || ''),
        escapeCSV(contact.state || ''),
        escapeCSV(contact.zipCode || ''),
        escapeCSV(contact.country || ''),
        escapeCSV(contact.website || ''),
        escapeCSV(contact.industry || ''),
        escapeCSV(contactData.subIndustry || ''),
        escapeCSV(contact.contactLinkedInUrl || contactData.LinkedInUrl || ''),
        escapeCSV(contact.companyName || ''),
        escapeCSV(contact.employeeSize || ''),
        escapeCSV(contact.revenue || ''),
        escapeCSV(contact.amfNotes || ''),
        escapeCSV(contactData.createdBy || contact.addedBy || ''),
        escapeCSV(contact.addedDate || contactData.createdAt || ''),
        escapeCSV(contact.lastUpdateDate || ''),
        escapeCSV(contact.updatedDate || contactData.updatedAt || '')
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(displayedContacts.map((contact: Contact) => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId]);
    } else {
      setSelectedContacts(selectedContacts.filter((id: string) => id !== contactId));
    }
  };

  const renderFormFields = (isEdit = false) => {
    const contactId = editingContact?.id || (editingContact as any)?._id || 'new';
    return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-firstName" : "firstName"}>First Name *</Label>
        <Input
          id={isEdit ? "edit-firstName" : "firstName"}
          value={newContact.firstName}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, firstName: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-lastName" : "lastName"}>Last Name *</Label>
        <Input
          id={isEdit ? "edit-lastName" : "lastName"}
          value={newContact.lastName}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, lastName: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-jobTitle" : "jobTitle"}>Job Title</Label>
        <Input
          id={isEdit ? "edit-jobTitle" : "jobTitle"}
          value={newContact.jobTitle}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, jobTitle: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label>Job Level</Label>
        <Select 
          key={`jobLevel-${contactId}`}
          value={newContact.jobLevel || ''} 
          onValueChange={(value: string) => setNewContact({...newContact, jobLevel: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Analyst">Analyst</SelectItem>
            <SelectItem value="Below Manager">Below Manager</SelectItem>
            <SelectItem value="C-Level">C-Level</SelectItem>
            <SelectItem value="Developer">Developer</SelectItem>
            <SelectItem value="Director">Director</SelectItem>
            <SelectItem value="Engineer">Engineer</SelectItem>
            <SelectItem value="General Manager">General Manager</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="Managing Director">Managing Director</SelectItem>
            <SelectItem value="Vice President">Vice President</SelectItem>
            <SelectItem value="Architect">Architect</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Job Role</Label>
        <Select 
          key={`jobRole-${contactId}`}
          value={newContact.jobRole || ''} 
          onValueChange={(value: string) => setNewContact({...newContact, jobRole: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Administration">Administration</SelectItem>
            <SelectItem value="Business Development">Business Development</SelectItem>
            <SelectItem value="Client Management">Client Management</SelectItem>
            <SelectItem value="Customer Experience">Customer Experience</SelectItem>
            <SelectItem value="Customer Success">Customer Success</SelectItem>
            <SelectItem value="Data & Analytics">Data & Analytics</SelectItem>
            <SelectItem value="Demand Generation">Demand Generation</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Growth">Growth</SelectItem>
            <SelectItem value="Human Resources">Human Resources</SelectItem>
            <SelectItem value="Information Technology">Information Technology</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Operations">Operations</SelectItem>
            <SelectItem value="Others">Others</SelectItem>
            <SelectItem value="Procurement / Sourcing / Supply Chain">Procurement / Sourcing / Supply Chain</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
            <SelectItem value="Quality">Quality</SelectItem>
            <SelectItem value="Risk & Compliance">Risk & Compliance</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="Sales & Marketing">Sales & Marketing</SelectItem>
            <SelectItem value="Strategy">Strategy</SelectItem>
            <SelectItem value="Underwriting">Underwriting</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-email" : "email"}>Email</Label>
        <Input
          id={isEdit ? "edit-email" : "email"}
          type="email"
          value={newContact.email}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, email: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-phone" : "phone"}>Phone</Label>
        <Input
          id={isEdit ? "edit-phone" : "phone"}
          value={newContact.phone}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, phone: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-directPhone" : "directPhone"}>Direct Phone</Label>
        <Input
          id={isEdit ? "edit-directPhone" : "directPhone"}
          value={newContact.directPhone}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, directPhone: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-address1" : "address1"}>Address 1</Label>
        <Input
          id={isEdit ? "edit-address1" : "address1"}
          value={newContact.address1}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, address1: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-address2" : "address2"}>Address 2</Label>
        <Input
          id={isEdit ? "edit-address2" : "address2"}
          value={newContact.address2}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, address2: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-city" : "city"}>City</Label>
        <Input
          id={isEdit ? "edit-city" : "city"}
          value={newContact.city}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, city: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-state" : "state"}>State</Label>
        <Input
          id={isEdit ? "edit-state" : "state"}
          value={newContact.state}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, state: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-zipCode" : "zipCode"}>Zip Code</Label>
        <Input
          id={isEdit ? "edit-zipCode" : "zipCode"}
          value={newContact.zipCode}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, zipCode: e.target.value})}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-country" : "country"}>Country</Label>
        <CountrySelect
          value={newContact.country}
          onValueChange={(value: string) => setNewContact({...newContact, country: value})}
          placeholder="Select country..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-website" : "website"}>Website</Label>
        <Input
          id={isEdit ? "edit-website" : "website"}
          value={newContact.website}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, website: e.target.value})}
          placeholder="https://example.com"
        />
      </div>
      <div className="space-y-2">
        <Label>Industry</Label>
        <Select 
          key={`industry-${contactId}`}
          value={newContact.industry || ''} 
          onValueChange={(value: string) => {
            setNewContact({...newContact, industry: value, subIndustry: ''});
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map((industry) => (
              <SelectItem key={industry.value} value={industry.value}>{industry.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {newContact.industry && (
        <div className="space-y-2">
          <Label>Sub-Industry</Label>
          {newContact.industry === 'Other' ? (
            <Input
              value={newContact.subIndustry || ''}
              onChange={(e: { target: { value: string } }) => setNewContact({...newContact, subIndustry: e.target.value})}
              placeholder="Enter sub-industry"
            />
          ) : industrySubIndustryMap[newContact.industry] ? (
            <Select 
              key={`subIndustry-${contactId}-${newContact.industry}`}
              value={newContact.subIndustry || ''} 
              onValueChange={(value: string) => setNewContact({...newContact, subIndustry: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sub-industry" />
              </SelectTrigger>
              <SelectContent>
                {industrySubIndustryMap[newContact.industry].map((subIndustry) => (
                  <SelectItem key={subIndustry} value={subIndustry}>{subIndustry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-contactLinkedInUrl" : "contactLinkedInUrl"}>Contact LinkedIn URL</Label>
        <Input
          id={isEdit ? "edit-contactLinkedInUrl" : "contactLinkedInUrl"}
          value={newContact.contactLinkedInUrl}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, contactLinkedInUrl: e.target.value})}
          placeholder="https://linkedin.com/in/username"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-lastUpdateDate" : "lastUpdateDate"}>Last Update Date</Label>
        <Input
          id={isEdit ? "edit-lastUpdateDate" : "lastUpdateDate"}
          type="date"
          value={newContact.lastUpdateDate}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, lastUpdateDate: e.target.value})}
        />
      </div>
      
      {/* Required Company Information */}
      <div className="md:col-span-2">
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-4">Company Information</h3>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-companyName" : "companyName"}>Company Name *</Label>
        <Input
          id={isEdit ? "edit-companyName" : "companyName"}
          value={newContact.companyName}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, companyName: e.target.value})}
          placeholder="Enter company name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-employeeSize" : "employeeSize"}>Employee Size *</Label>
        <Select 
          key={`employeeSize-${contactId}`}
          value={newContact.employeeSize || ''} 
          onValueChange={(value: string) => setNewContact({...newContact, employeeSize: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select employee size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1to25">1 to 25</SelectItem>
            <SelectItem value="26to50">26 to 50</SelectItem>
            <SelectItem value="51to100">51 to 100</SelectItem>
            <SelectItem value="101to250">101 to 250</SelectItem>
            <SelectItem value="251to500">251 to 500</SelectItem>
            <SelectItem value="501to1000">501 to 1000</SelectItem>
            <SelectItem value="1001to2500">1001 to 2500</SelectItem>
            <SelectItem value="2501to5000">2501 to 5000</SelectItem>
            <SelectItem value="5001to10000">5001 to 10000</SelectItem>
            <SelectItem value="over10001">over 10,001</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={isEdit ? "edit-revenue" : "revenue"}>Revenue *</Label>
        <Select 
          key={`revenue-${contactId}`}
          value={newContact.revenue || ''} 
          onValueChange={(value: string) => setNewContact({...newContact, revenue: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select revenue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Lessthan1M">Less than $1M</SelectItem>
            <SelectItem value="1Mto5M">$1M to $5M</SelectItem>
            <SelectItem value="5Mto10M">$5M to $10M</SelectItem>
            <SelectItem value="10Mto50M">$10M to $50M</SelectItem>
            <SelectItem value="50Mto100M">$50M to $100M</SelectItem>
            <SelectItem value="100Mto250M">$100M to $250M</SelectItem>
            <SelectItem value="250Mto500M">$250M to $500M</SelectItem>
            <SelectItem value="500Mto1B">$500M to $1B</SelectItem>
            <SelectItem value="Morethan1B">More than $1B</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="md:col-span-2 space-y-2">
        <Label htmlFor={isEdit ? "edit-amfNotes" : "amfNotes"}>aMF Notes</Label>
        <Textarea
          id={isEdit ? "edit-amfNotes" : "amfNotes"}
          value={newContact.amfNotes}
          onChange={(e: { target: { value: string } }) => setNewContact({...newContact, amfNotes: e.target.value})}
          rows={3}
          placeholder="Additional notes about the contact..."
        />
      </div>
    </div>
    );
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>Contacts ({totalCount})</CardTitle>
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
                placeholder="Search contacts..."
                value={searchQuery || ''}
                onChange={(e: { target: { value: string } }) => {
                  const value = e.target.value;
                  handleSearchInputChange(value);
                }}
                className="pl-9 h-9"
              />
            </div>
            
            {/* View Mode Toggle */}


            {selectedContacts.length > 0 && (
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
                      Delete ({selectedContacts.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Contacts</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedContacts.length} selected contacts? This action cannot be undone.
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
                  Export ({selectedContacts.length})
                </Button>
              </>
            )}
            <AlertDialog open={showExportAllDialog} onOpenChange={setShowExportAllDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={isExportingAll || selectedContacts.length > 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExportingAll ? 'Exporting...' : 'Export All'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Export All Contacts</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to export all {totalCount} contacts? This may take a moment to fetch all data.
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
              className="bg-[#EF8037] hover:bg-[#EF8037]/90 text-white"
              onClick={() => router.push('/contacts/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="overflow-y-auto overflow-x-auto flex-1" style={{ 
          scrollbarWidth: 'thin', 
          scrollbarColor: '#EF8037 #f1f1f1',
          minHeight: 0,
          maxHeight: '100%'
        }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedContacts.length === displayedContacts.length && displayedContacts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('firstName')} className="cursor-pointer">
                  <div className="flex items-center">
                    Name {getSortIcon('firstName')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('phone')} className="cursor-pointer">
                  <div className="flex items-center">
                    Phone {getSortIcon('phone')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('email')} className="cursor-pointer">
                  <div className="flex items-center">
                    Email {getSortIcon('email')}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    Company
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('addedDate')} className="cursor-pointer">
                  <div className="flex items-center">
                    Created Date {getSortIcon('addedDate')}
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
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-red-600">
                    {error}
                  </TableCell>
                </TableRow>
              ) : displayedContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No contacts found
                  </TableCell>
                </TableRow>
              ) : (
                displayedContacts.map((contact: Contact) => {
                  return (
                <TableRow 
                  key={contact.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={(e: any) => {
                    // Don't trigger row click if clicking on interactive elements
                    const target = e.target as HTMLElement;
                    if (!target.closest('button') && !target.closest('[role="checkbox"]') && !target.closest('[role="menuitem"]')) {
                      onViewContact?.(contact);
                    }
                  }}
                >
                  <TableCell onClick={(e: any) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked: boolean) => handleSelectContact(contact.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gray-200">
                          {getInitials(contact.firstName, contact.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                        <div className="text-sm text-gray-500">{contact.jobTitle}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{contact.phone || '-'}</TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell>{getCompanyName(contact) || '-'}</TableCell>
                  <TableCell>
                    {(() => {
                      const date = (contact as any).createdAt || contact.addedDate;
                      if (!date) return '-';
                      try {
                        const dateObj = typeof date === 'string' ? new Date(date) : date;
                        return dateObj.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit' 
                        });
                      } catch {
                        return date;
                      }
                    })()}
                  </TableCell>
                  <TableCell onClick={(e: any) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewContact?.(contact)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportSingle(contact)}>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteContact(contact.id)}
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
                    style={currentPage === pageNum ? { backgroundColor: '#EF8037' } : {}}
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
