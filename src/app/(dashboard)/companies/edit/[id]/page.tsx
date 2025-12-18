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
import { updateCompany, getCompanies } from "@/store/slices/companies.slice";
import { privateApiCall } from "@/lib/api";
import { CountrySelect } from "@/components/CountrySelect";
import type { User, Company } from "@/types/dashboard.types";

// Industry and Sub-Industry mapping (same as CompaniesTable)
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

// Helper functions to normalize values
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

// Validation functions
const validatePhone = (phone: string): boolean => {
  if (!phone || phone.trim() === '') return true; // Optional field
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

const validateWebsite = (website: string): boolean => {
  if (!website || website.trim() === '') return true; // Optional field
  try {
    let urlToValidate = website.trim();
    if (!urlToValidate.match(/^https?:\/\//i)) {
      urlToValidate = 'https://' + urlToValidate;
    }
    const url = new URL(urlToValidate);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.id as string;
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { companies: reduxCompanies } = useAppSelector((state) => state.companies);
  const { isUpdating } = useAppSelector((state) => state.companies);

  const dashboardUser: User | null = user ? {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
    role: user.role || null,
  } : null;

  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    companyName: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    otherCountry: '',
    website: '',
    revenue: '',
    employeeSize: '',
    industry: '',
    otherIndustry: '',
    subIndustry: '',
    technology: '',
    companyLinkedInUrl: '',
    amfNotes: '',
    lastUpdateDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) {
        toast.error('Company ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // First, check if company is already in Redux store
        let companyData: any = reduxCompanies.find((c: Company) => {
          const cId = (c as any)._id?.toString() || c.id?.toString();
          return cId === companyId;
        });
        
        // If not found in Redux, fetch directly by id to avoid pagination loops
        if (!companyData) {
          const response = await privateApiCall<{ company: any }>(`/admin/companies?id=${companyId}`);
          companyData = response.company;
        }
        
        if (!companyData) {
          toast.error('Company not found');
          router.push('/companies');
          return;
        }
        
        // Normalize values
        const industriesArray = Object.keys(industrySubIndustryMap).map(industry => ({
          label: industry,
          value: industry,
        }));
        
        const normalizedIndustry = normalizeIndustry(companyData.industry, industriesArray);
        const normalizedEmployeeSize = normalizeEmployeeSize(companyData.employeeSize);
        const normalizedRevenue = normalizeRevenue(companyData.revenue);
        
        // Handle LinkedIn URL - check multiple possible field names
        const linkedInValue = (companyData as any).companyLinkedIn || 
                              (companyData as any).LinkedInUrl || 
                              (companyData as any).companyLinkedInUrl || '';
        
        // Handle otherCountry - check multiple possible field names
        const otherCountryValue = (companyData as any).otherCountry || '';
        
        // Handle otherIndustry - check multiple possible field names
        const otherIndustryValue = (companyData as any).otherIndustry || '';
        
        setFormData({
          companyName: String(companyData.companyName || '').trim(),
          phone: String(companyData.phone || '').trim(),
          address1: String(companyData.address1 || '').trim(),
          address2: String(companyData.address2 || '').trim(),
          city: String(companyData.city || '').trim(),
          state: String(companyData.state || '').trim(),
          zipCode: String(companyData.zipCode || '').trim(),
          country: String(companyData.country || '').trim(),
          otherCountry: String(otherCountryValue).trim(),
          website: String(companyData.website || '').trim(),
          revenue: (normalizedRevenue && normalizedRevenue !== '') ? normalizedRevenue : String(companyData.revenue || '').trim(),
          employeeSize: (normalizedEmployeeSize && normalizedEmployeeSize !== '') ? normalizedEmployeeSize : String(companyData.employeeSize || '').trim(),
          industry: (normalizedIndustry && normalizedIndustry !== '') ? normalizedIndustry : String(companyData.industry || '').trim(),
          otherIndustry: String(otherIndustryValue).trim(),
          subIndustry: String((companyData.subIndustry || '').trim()),
          technology: String(companyData.technology || '').trim(),
          companyLinkedInUrl: String(linkedInValue).trim(),
          amfNotes: String(companyData.amfNotes || '').trim(),
          lastUpdateDate: companyData.lastUpdateDate || new Date().toISOString().split('T')[0]
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch company';
        toast.error(errorMessage);
        router.push('/companies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [companyId, reduxCompanies, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.companyName) {
      toast.error('Company Name is required');
      return;
    }

    // Validate phone number
    if (formData.phone && !validatePhone(formData.phone)) {
      toast.error('Please enter a valid phone number (10-15 digits)');
      return;
    }

    // Validate website
    if (formData.website && !validateWebsite(formData.website)) {
      toast.error('Please enter a valid website URL (e.g., https://example.com)');
      return;
    }

    // Validate otherCountry if country is "Other"
    if (formData.country === 'Other' && !formData.otherCountry) {
      toast.error('Please enter the country name');
      return;
    }

    // Validate otherIndustry if industry is "Other"
    if (formData.industry === 'Other' && !formData.otherIndustry) {
      toast.error('Please enter the industry name');
      return;
    }

    try {
      const payload = {
        id: companyId,
        companyName: formData.companyName,
        phone: formData.phone || undefined,
        address1: formData.address1 || undefined,
        address2: formData.address2 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        country: formData.country || undefined,
        otherCountry: formData.otherCountry || undefined,
        website: formData.website || undefined,
        revenue: formData.revenue || undefined,
        employeeSize: formData.employeeSize || undefined,
        industry: formData.industry || undefined,
        otherIndustry: formData.otherIndustry || undefined,
        subIndustry: formData.subIndustry || undefined,
        technology: formData.technology || undefined,
        companyLinkedInUrl: formData.companyLinkedInUrl || undefined,
        amfNotes: formData.amfNotes || undefined,
        lastUpdateDate: formData.lastUpdateDate || undefined,
      };

      await dispatch(updateCompany(payload)).unwrap();
      
      toast.success('Company updated successfully');
      router.push('/companies');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update company');
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
          <p className="text-gray-600">Loading company details...</p>
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
                onClick={() => router.push('/companies')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle className="text-2xl">Edit Company</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Update the company information below.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, companyName: e.target.value})}
                      placeholder="Enter company name"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                      className={`h-11 ${formData.phone && !validatePhone(formData.phone) ? 'border-red-500' : ''}`}
                    />
                    {formData.phone && !validatePhone(formData.phone) && (
                      <p className="text-xs text-red-500">Please enter a valid phone number (10-15 digits)</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://company.com"
                      className={`h-11 ${formData.website && !validateWebsite(formData.website) ? 'border-red-500' : ''}`}
                    />
                    {formData.website && !validateWebsite(formData.website) && (
                      <p className="text-xs text-red-500">Please enter a valid website URL (e.g., https://example.com)</p>
                    )}
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
                      <Label htmlFor="otherCountry">Other Country *</Label>
                      <Input
                        id="otherCountry"
                        value={formData.otherCountry}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, otherCountry: e.target.value})}
                        placeholder="Enter country name"
                        className="h-11"
                        required
                      />
                    </div>
                  )}

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
                      <Label htmlFor="otherIndustry">Other Industry *</Label>
                      <Input
                        id="otherIndustry"
                        value={formData.otherIndustry}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, otherIndustry: e.target.value})}
                        placeholder="Enter industry name"
                        className="h-11"
                        required
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
                    <Label>Employee Size</Label>
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

                  <div className="space-y-2">
                    <Label>Revenue</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="technology">Technology – Installed Base</Label>
                    <Input
                      id="technology"
                      value={formData.technology}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, technology: e.target.value})}
                      placeholder="React, Node.js, AWS"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyLinkedInUrl">Company LinkedIn URL</Label>
                    <Input
                      id="companyLinkedInUrl"
                      value={formData.companyLinkedInUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, companyLinkedInUrl: e.target.value})}
                      placeholder="https://linkedin.com/company/..."
                      className="h-11"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="amfNotes">aMF Notes</Label>
                    <Textarea
                      id="amfNotes"
                      value={formData.amfNotes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, amfNotes: e.target.value})}
                      rows={3}
                      placeholder="Additional notes about the company..."
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/companies')}
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
                  {isUpdating ? 'Updating...' : 'Update Company'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

