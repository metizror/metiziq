"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { createCompany } from "@/store/slices/companies.slice";
import { CountrySelect } from "@/components/CountrySelect";
import { CompanyNameAutocomplete } from "@/components/CompanyNameAutocomplete";
import type { User } from "@/types/dashboard.types";
import { companyFormSchema, type CompanyFormValues } from "@/validation-schemas/companyFormSchema";

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

export default function NewCompanyPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isCreating } = useAppSelector((state) => state.companies);

  const dashboardUser: User | null = user ? {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
    role: user.role || null,
  } : null;

  // Ref to track if we should scroll to first error
  const shouldScrollToError = useRef(false);

  const formik = useFormik<CompanyFormValues>({
    initialValues: {
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
    },
    validationSchema: companyFormSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        // Prepare payload for API
        const payload = {
          companyName: values.companyName,
          phone: values.phone || undefined,
          address1: values.address1 || undefined,
          address2: values.address2 || undefined,
          city: values.city || undefined,
          state: values.state || undefined,
          zipCode: values.zipCode || undefined,
          country: values.country || undefined,
          otherCountry: values.country === 'Other' ? values.otherCountry || undefined : undefined,
          website: values.website || undefined,
          revenue: values.revenue || undefined,
          employeeSize: values.employeeSize || undefined,
          industry: values.industry || undefined,
          otherIndustry: values.industry === 'Other' ? values.otherIndustry || undefined : undefined,
          subIndustry: values.subIndustry || undefined,
          technology: values.technology || undefined,
          companyLinkedInUrl: values.companyLinkedInUrl || undefined,
          amfNotes: values.amfNotes || undefined,
          lastUpdateDate: values.lastUpdateDate || undefined,
        };

        await dispatch(createCompany(payload)).unwrap();
        
        toast.success('Company added successfully');
        router.push('/companies');
      } catch (error: any) {
        toast.error(error.message || 'Failed to add company');
      }
    },
  });

  // Scroll to first error field when validation fails
  useEffect(() => {
    if (shouldScrollToError.current && Object.keys(formik.errors).length > 0) {
      // Find the first field with an error
      const firstErrorField = Object.keys(formik.errors)[0];
      const errorElement = document.getElementById(firstErrorField);
      
      if (errorElement) {
        // Scroll to the error field
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the field
        setTimeout(() => {
          errorElement.focus();
        }, 300);
      }
      shouldScrollToError.current = false;
    }
  }, [formik.errors, formik.submitCount]);

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
                <CardTitle className="text-2xl">Add New Company</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Fill in the company details below to add a new company to the system.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                shouldScrollToError.current = true;
                formik.handleSubmit(e);
              }} 
              className="space-y-8"
            >
              {/* Company Information Section */}
              <div>
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
                    <CompanyNameAutocomplete
                      id="companyName"
                      name="companyName"
                      value={formik.values.companyName}
                      onChange={(value) => formik.setFieldValue('companyName', value)}
                      onBlur={formik.handleBlur}
                      placeholder="Enter company name"
                      className={formik.touched.companyName && formik.errors.companyName ? 'border-red-500' : ''}
                      error={formik.touched.companyName && !!formik.errors.companyName}
                    />
                    {formik.touched.companyName && formik.errors.companyName && (
                      <p className="text-xs text-red-600">{formik.errors.companyName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formik.values.phone || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="+1 (555) 123-4567"
                      className={`h-11 ${formik.touched.phone && formik.errors.phone ? 'border-red-500' : ''}`}
                    />
                    {formik.touched.phone && formik.errors.phone && (
                      <p className="text-xs text-red-600">{formik.errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formik.values.website || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="https://company.com"
                      className={`h-11 ${formik.touched.website && formik.errors.website ? 'border-red-500' : ''}`}
                    />
                    {formik.touched.website && formik.errors.website && (
                      <p className="text-xs text-red-600">{formik.errors.website}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address1">Address 1</Label>
                    <Input
                      id="address1"
                      name="address1"
                      value={formik.values.address1 || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="123 Main St"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address2">Address 2</Label>
                    <Input
                      id="address2"
                      name="address2"
                      value={formik.values.address2 || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Suite 100"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formik.values.city || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="New York"
                      className="h-11"
                    />  
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formik.values.state || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="NY"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formik.values.zipCode || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="10001"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <CountrySelect
                      value={formik.values.country || ''}
                      onValueChange={(value: string) => {
                        formik.setFieldValue('country', value);
                        if (value !== 'Other') {
                          formik.setFieldValue('otherCountry', '');
                        }
                      }}
                      placeholder="Select country..."
                    />
                  </div>

                  {formik.values.country === 'Other' && (
                    <div className="space-y-2">
                      <Label htmlFor="otherCountry">Other Country *</Label>
                      <Input
                        id="otherCountry"
                        name="otherCountry"
                        value={formik.values.otherCountry || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Enter country name"
                        className={`h-11 ${formik.touched.otherCountry && formik.errors.otherCountry ? 'border-red-500' : ''}`}
                      />
                      {formik.touched.otherCountry && formik.errors.otherCountry && (
                        <p className="text-xs text-red-600">{formik.errors.otherCountry}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select 
                      value={formik.values.industry || ''} 
                      onValueChange={(value: string) => {
                        formik.setFieldValue('industry', value);
                        formik.setFieldValue('subIndustry', '');
                        if (value !== 'Other') {
                          formik.setFieldValue('otherIndustry', '');
                        }
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

                  {formik.values.industry === 'Other' && (
                    <div className="space-y-2">
                      <Label htmlFor="otherIndustry">Other Industry *</Label>
                      <Input
                        id="otherIndustry"
                        name="otherIndustry"
                        value={formik.values.otherIndustry || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Enter industry name"
                        className={`h-11 ${formik.touched.otherIndustry && formik.errors.otherIndustry ? 'border-red-500' : ''}`}
                      />
                      {formik.touched.otherIndustry && formik.errors.otherIndustry && (
                        <p className="text-xs text-red-600">{formik.errors.otherIndustry}</p>
                      )}
                    </div>
                  )}

                  {formik.values.industry && (
                    <div className="space-y-2">
                      <Label>Sub-Industry</Label>
                      {formik.values.industry === 'Other' ? (
                        <Input
                          name="subIndustry"
                          value={formik.values.subIndustry || ''}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="Enter sub-industry"
                          className="h-11"
                        />
                      ) : industrySubIndustryMap[formik.values.industry] ? (
                        <Select 
                          value={formik.values.subIndustry || ''} 
                          onValueChange={(value: string) => formik.setFieldValue('subIndustry', value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select sub-industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industrySubIndustryMap[formik.values.industry].map((subIndustry) => (
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
                      value={formik.values.employeeSize || ''} 
                      onValueChange={(value: string) => formik.setFieldValue('employeeSize', value)}
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
                      value={formik.values.revenue || ''} 
                      onValueChange={(value: string) => formik.setFieldValue('revenue', value)}
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
                      name="technology"
                      value={formik.values.technology || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="React, Node.js, AWS"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyLinkedInUrl">Company LinkedIn URL</Label>
                    <Input
                      id="companyLinkedInUrl"
                      name="companyLinkedInUrl"
                      value={formik.values.companyLinkedInUrl || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="https://linkedin.com/company/..."
                      className={`h-11 ${formik.touched.companyLinkedInUrl && formik.errors.companyLinkedInUrl ? 'border-red-500' : ''}`}
                    />
                    {formik.touched.companyLinkedInUrl && formik.errors.companyLinkedInUrl && (
                      <p className="text-xs text-red-600">{formik.errors.companyLinkedInUrl}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="amfNotes">aMF Notes</Label>
                    <Textarea
                      id="amfNotes"
                      name="amfNotes"
                      value={formik.values.amfNotes || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
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
                  disabled={isCreating || formik.isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white"
                  disabled={isCreating || formik.isSubmitting}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isCreating || formik.isSubmitting ? 'Saving...' : 'Save Company'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

