"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateContact, getContacts, type GetContactsParams } from "@/store/slices/contacts.slice";
import { privateApiCall } from "@/lib/api";
import { CountrySelect } from "@/components/CountrySelect";
import type { User, Contact } from "@/types/dashboard.types";

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

// Helper functions to normalize values (same as ContactsTable)
const normalizeRevenue = (value: string | undefined): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  
  const validRevenues = [
    'Lessthan1M', '1Mto5M', '5Mto10M', '10Mto50M', '50Mto100M',
    '100Mto250M', '250Mto500M', '500Mto1B', 'Morethan1B'
  ];
  
  const exactMatch = validRevenues.find(rev => rev === trimmed);
  if (exactMatch) return exactMatch;
  
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
  
  if (trimmed === 'Less than $1M' || trimmed.toLowerCase() === 'less than $1m' || trimmed === 'Less-than-$1M') return 'Lessthan1M';
  if (trimmed === 'More than $1B' || trimmed.toLowerCase() === 'more than $1b' || trimmed === 'More-than-$1B') return 'Morethan1B';
  
  let normalized = trimmed.replace(/\$/g, '').replace(/\s+to\s+/gi, 'to').replace(/-/g, 'to');
  const normalizedMatch = validRevenues.find(rev => rev === normalized);
  if (normalizedMatch) return normalizedMatch;
  
  return '';
};

const normalizeEmployeeSize = (value: string | undefined): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  
  const validSizes = [
    '1to25', '26to50', '51to100', '101to250', '251to500',
    '501to1000', '1001to2500', '2501to5000', '5001to10000', 'over10001'
  ];
  
  const exactMatch = validSizes.find(size => size === trimmed);
  if (exactMatch) return exactMatch;
  
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
  
  if (trimmed === 'over 10,001' || trimmed.toLowerCase() === 'over 10,001') return 'over10001';
  
  let normalized = trimmed.replace(/\s+to\s+/gi, 'to').replace(/-/g, 'to').replace(/\s+/g, '');
  const normalizedMatch = validSizes.find(size => size === normalized);
  if (normalizedMatch) return normalizedMatch;
  
  return '';
};

const normalizeJobLevel = (value: string | undefined): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const validLevels = [
    'Analyst', 'Below Manager', 'C-Level', 'Developer', 'Director', 
    'Engineer', 'General Manager', 'Manager', 'Managing Director', 
    'Vice President', 'Architect'
  ];
  const matched = validLevels.find(level => level.toLowerCase() === trimmed.toLowerCase());
  if (matched) return matched;
  const exactMatch = validLevels.find(level => level === trimmed);
  return exactMatch || '';
};

const normalizeJobRole = (value: string | undefined): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  
  const validRoles = [
    'Administration', 'Business Development', 'Client Management', 
    'Customer Experience', 'Customer Success', 'Data & Analytics', 
    'Demand Generation', 'Engineering', 'Finance', 'Growth', 
    'Human Resources', 'Information Technology', 'Legal', 'Manufacturing', 
    'Marketing', 'Operations', 'Others', 
    'Procurement / Sourcing / Supply Chain', 'Product', 'Quality', 
    'Risk & Compliance', 'Sales', 'Sales & Marketing', 'Strategy', 'Underwriting'
  ];
  
  const exactMatch = validRoles.find(role => role === trimmed);
  if (exactMatch) return exactMatch;
  
  const caseInsensitiveMatch = validRoles.find(role => role.toLowerCase() === trimmed.toLowerCase());
  if (caseInsensitiveMatch) return caseInsensitiveMatch;
  
  return '';
};

const normalizeIndustry = (value: string | undefined, industries: { value: string; label: string }[]): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const matched = industries.find(industry => 
    industry.value.toLowerCase() === trimmed.toLowerCase() || 
    industry.label.toLowerCase() === trimmed.toLowerCase()
  );
  if (matched) return matched.value;
  const exactMatch = industries.find(industry => 
    industry.value === trimmed || industry.label === trimmed
  );
  return exactMatch ? exactMatch.value : '';
};

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params?.id as string;
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { contacts: reduxContacts } = useAppSelector((state) => state.contacts);
  const { isUpdating } = useAppSelector((state) => state.contacts);

  const dashboardUser: User | null = user ? {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
    role: user.role || null,
  } : null;

  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
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
    otherCountry: '',
    website: '',
    industry: '',
    otherIndustry: '',
    subIndustry: '',
    contactLinkedInUrl: '',
    amfNotes: '',
    lastUpdateDate: new Date().toISOString().split('T')[0],
    companyName: '',
    employeeSize: '',
    revenue: ''
  });

  useEffect(() => {
    const fetchContact = async () => {
      if (!contactId) {
        toast.error('Contact ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // First, check if contact is already in Redux store
        let contactData: any = reduxContacts.find((c: Contact) => {
          const cId = (c as any)._id?.toString() || c.id?.toString();
          return cId === contactId;
        });
        
        // If not found in Redux, fetch from API
        if (!contactData) {
          let found = false;
          let page = 1;
          const limit = 100;
          
          while (!found && page <= 100) {
            const response = await privateApiCall<{ contacts: any[], pagination: any }>(`/admin/contacts?page=${page}&limit=${limit}`);
            
            contactData = response.contacts.find((c: any) => {
              const cId = c._id?.toString() || c.id?.toString();
              return cId === contactId;
            });
            
            if (contactData) {
              found = true;
              break;
            }
            
            if (page >= response.pagination.totalPages) {
              break;
            }
            
            page++;
          }
        }
        
        if (!contactData) {
          toast.error('Contact not found');
          router.push('/contacts');
          return;
        }
        
        // Normalize values
        const industriesArray = Object.keys(industrySubIndustryMap).map(industry => ({
          label: industry,
          value: industry,
        }));
        
        const normalizedJobLevel = normalizeJobLevel(contactData.jobLevel);
        const normalizedJobRole = normalizeJobRole(contactData.jobRole);
        const normalizedIndustry = normalizeIndustry(contactData.industry, industriesArray);
        const normalizedEmployeeSize = normalizeEmployeeSize(contactData.employeeSize);
        const normalizedRevenue = normalizeRevenue(contactData.revenue);
        
        // Handle LinkedIn URL - check multiple possible field names
        const linkedInValue = (contactData as any).contactLinkedIn || 
                              (contactData as any).LinkedInUrl || 
                              (contactData as any).contactLinkedInUrl || '';
        
        // Handle otherCountry - check multiple possible field names
        const otherCountryValue = (contactData as any).otherCountry || '';
        
        // Handle otherIndustry - check multiple possible field names
        const otherIndustryValue = (contactData as any).otherIndustry || '';
        
        setFormData({
          firstName: String(contactData.firstName || '').trim(),
          lastName: String(contactData.lastName || '').trim(),
          jobTitle: String(contactData.jobTitle || '').trim(),
          jobLevel: (normalizedJobLevel && normalizedJobLevel !== '') ? normalizedJobLevel : String(contactData.jobLevel || '').trim(),
          jobRole: (normalizedJobRole && normalizedJobRole !== '') ? normalizedJobRole : String(contactData.jobRole || '').trim(),
          email: String(contactData.email || '').trim(),
          phone: String(contactData.phone || '').trim(),
          directPhone: String(contactData.directPhone || '').trim(),
          address1: String(contactData.address1 || '').trim(),
          address2: String(contactData.address2 || '').trim(),
          city: String(contactData.city || '').trim(),
          state: String(contactData.state || '').trim(),
          zipCode: String(contactData.zipCode || '').trim(),
          country: String(contactData.country || '').trim(),
          otherCountry: String(otherCountryValue).trim(),
          website: String(contactData.website || '').trim(),
          industry: (normalizedIndustry && normalizedIndustry !== '') ? normalizedIndustry : String(contactData.industry || '').trim(),
          otherIndustry: String(otherIndustryValue).trim(),
          subIndustry: String((contactData.subIndustry || '').trim()),
          contactLinkedInUrl: String(linkedInValue).trim(),
          amfNotes: String(contactData.amfNotes || '').trim(),
          lastUpdateDate: contactData.lastUpdateDate || new Date().toISOString().split('T')[0],
          companyName: String(contactData.companyName || '').trim(),
          employeeSize: (normalizedEmployeeSize && normalizedEmployeeSize !== '') ? normalizedEmployeeSize : String(contactData.employeeSize || '').trim(),
          revenue: (normalizedRevenue && normalizedRevenue !== '') ? normalizedRevenue : String(contactData.revenue || '').trim()
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch contact';
        toast.error(errorMessage);
        router.push('/contacts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [contactId, reduxContacts, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        id: contactId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        jobTitle: formData.jobTitle || undefined,
        jobLevel: formData.jobLevel || undefined,
        jobRole: formData.jobRole || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        directPhone: formData.directPhone || undefined,
        address1: formData.address1 || undefined,
        address2: formData.address2 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        country: formData.country || undefined,
        otherCountry: formData.otherCountry || undefined,
        website: formData.website || undefined,
        industry: formData.industry || undefined,
        otherIndustry: formData.otherIndustry || undefined,
        subIndustry: formData.subIndustry || undefined,
        contactLinkedIn: formData.contactLinkedInUrl || undefined,
        lastUpdateDate: formData.lastUpdateDate || undefined,
        companyName: formData.companyName || undefined,
        employeeSize: formData.employeeSize || undefined,
        revenue: formData.revenue || undefined,
        amfNotes: formData.amfNotes || undefined,
      };

      await dispatch(updateContact(payload)).unwrap();
      
      toast.success('Contact updated successfully');
      router.push('/contacts');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update contact');
    }
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
          <p className="text-gray-600">Loading contact details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/contacts')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle className="text-2xl">Edit Contact</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Update the contact information below.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-sm font-medium text-gray-700 uppercase tracking-wider px-3">
                    Contact Information
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, firstName: e.target.value})}
                      placeholder="John"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, lastName: e.target.value})}
                      placeholder="Doe"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, jobTitle: e.target.value})}
                      placeholder="Software Engineer"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Job Level</Label>
                    <Select 
                      value={formData.jobLevel || ''} 
                      onValueChange={(value: string) => setFormData({...formData, jobLevel: value})}
                    >
                      <SelectTrigger className="h-11">
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
                      value={formData.jobRole || ''} 
                      onValueChange={(value: string) => setFormData({...formData, jobRole: value})}
                    >
                      <SelectTrigger className="h-11">
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
                      placeholder="john.doe@example.com"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="directPhone">Direct Phone</Label>
                    <Input
                      id="directPhone"
                      value={formData.directPhone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, directPhone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address1">Address 1</Label>
                    <Input
                      id="address1"
                      value={formData.address1}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, address1: e.target.value})}
                      placeholder="123 Main St"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address2">Address 2</Label>
                    <Input
                      id="address2"
                      value={formData.address2}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, address2: e.target.value})}
                      placeholder="Suite 100"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, city: e.target.value})}
                      placeholder="New York"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, state: e.target.value})}
                      placeholder="NY"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, zipCode: e.target.value})}
                      placeholder="10001"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <CountrySelect
                      value={formData.country}
                      onValueChange={(value: string) => setFormData({
                        ...formData, 
                        country: value,
                        otherCountry: value !== 'Other' ? '' : formData.otherCountry
                      })}
                      placeholder="Select country..."
                    />
                  </div>

                  {formData.country === 'Other' && (
                    <div className="space-y-2">
                      <Label htmlFor="otherCountry">Other Country</Label>
                      <Input
                        id="otherCountry"
                        value={formData.otherCountry}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, otherCountry: e.target.value})}
                        placeholder="Enter country name"
                        className="h-11"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://example.com"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select 
                      value={formData.industry || ''} 
                      onValueChange={(value: string) => {
                        setFormData({
                          ...formData, 
                          industry: value, 
                          subIndustry: '',
                          otherIndustry: value !== 'Other' ? '' : formData.otherIndustry
                        });
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry.value} value={industry.value}>{industry.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.industry === 'Other' && (
                    <div className="space-y-2">
                      <Label htmlFor="otherIndustry">Other Industry</Label>
                      <Input
                        id="otherIndustry"
                        value={formData.otherIndustry}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, otherIndustry: e.target.value})}
                        placeholder="Enter industry name"
                        className="h-11"
                      />
                    </div>
                  )}

                  {formData.industry && (
                    <div className="space-y-2">
                      <Label>Sub-Industry</Label>
                      {formData.industry === 'Other' ? (
                        <Input
                          value={formData.subIndustry || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, subIndustry: e.target.value})}
                          placeholder="Enter sub-industry"
                          className="h-11"
                        />
                      ) : industrySubIndustryMap[formData.industry] ? (
                        <Select 
                          value={formData.subIndustry || ''} 
                          onValueChange={(value: string) => setFormData({...formData, subIndustry: value})}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select sub-industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industrySubIndustryMap[formData.industry].map((subIndustry) => (
                              <SelectItem key={subIndustry} value={subIndustry}>{subIndustry}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="contactLinkedInUrl">Contact LinkedIn URL</Label>
                    <Input
                      id="contactLinkedInUrl"
                      value={formData.contactLinkedInUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, contactLinkedInUrl: e.target.value})}
                      placeholder="https://linkedin.com/in/username"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastUpdateDate">Last Update Date</Label>
                    <Input
                      id="lastUpdateDate"
                      type="date"
                      value={formData.lastUpdateDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, lastUpdateDate: e.target.value})}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information Section */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-sm font-medium text-gray-700 uppercase tracking-wider px-3">
                    Company Information
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, companyName: e.target.value})}
                      placeholder="Enter company name"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeSize">Employee Size</Label>
                    <Select 
                      value={formData.employeeSize || ''} 
                      onValueChange={(value: string) => setFormData({...formData, employeeSize: value})}
                    >
                      <SelectTrigger className="h-11">
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
                    <Label htmlFor="revenue">Revenue</Label>
                    <Select 
                      value={formData.revenue || ''} 
                      onValueChange={(value: string) => setFormData({...formData, revenue: value})}
                    >
                      <SelectTrigger className="h-11">
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
                    <Label htmlFor="amfNotes">aMF Notes</Label>
                    <Textarea
                      id="amfNotes"
                      value={formData.amfNotes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, amfNotes: e.target.value})}
                      rows={3}
                      placeholder="Additional notes about the contact..."
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/contacts')}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white"
                  disabled={isUpdating}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdating ? 'Updating...' : 'Update Contact'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

