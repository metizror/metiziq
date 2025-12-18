import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { X, Filter, RotateCcw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useCountries, type Country } from '@/hooks/useCountries';

interface CompanyFilterPanelProps {
  filters: any;
  setFilters?: (filters: any) => void;
  onFilterChange?: (filters: any) => void;
  onClose: () => void;
}

export function CompanyFilterPanel({ filters, setFilters, onFilterChange, onClose }: CompanyFilterPanelProps) {
  const [companyExpanded, setCompanyExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters);
  const { countries: apiCountries } = useCountries();

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

  const industries = Object.keys(industrySubIndustryMap).map(industry => ({
    label: industry,
    value: industry,
  }));
  // Map API countries to label/value format and add "Other" at the end
  const countries = [
    ...apiCountries.map((country: Country) => ({
      label: country.name,
      value: country.name,
    })),
    { label: 'Other', value: 'Other' }
  ];

  const handleClearFilters = () => {
    // Clear all filter values and apply immediately
    const clearedFilters: any = {
      page: 1,
      limit: 25,
    };
    setLocalFilters(clearedFilters);
    if (onFilterChange) {
      // Pass an object that will reset all filters to empty/undefined
      const resetFilters: any = {
        companyName: undefined,
        employeeSize: undefined,
        revenue: undefined,
        industry: undefined,
        country: undefined,
        state: undefined,
        technology: undefined,
        page: 1,
        limit: 25,
      };
      onFilterChange(resetFilters);
    } else if (setFilters) {
      setFilters(clearedFilters);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    // Update local filters only (don't apply yet - wait for Apply button)
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    // Don't call onFilterChange here - wait for Apply button
  };

  const handleApplyFilters = () => {
    // Apply filters when Apply button is clicked
    if (onFilterChange) {
      onFilterChange(localFilters);
    } else if (setFilters) {
      setFilters(localFilters);
    }
  };

  // Check if any filter has been changed from initial state
  const hasFilterChanges = React.useMemo(() => {
    const filterFields = ['companyName', 'employeeSize', 'revenue', 'industry', 'country', 'technology'];
    
    // Check if any filter field has a value different from initial filters
    return filterFields.some(field => {
      const localValue = localFilters[field] || '';
      const initialValue = filters[field] || '';
      return localValue !== initialValue && localValue !== '';
    });
  }, [localFilters, filters]);

  // Update local filters when props change (only when filters are cleared externally)
  useEffect(() => {
    // Only sync if filters prop is empty (cleared) or significantly different
    // This prevents overwriting user input while typing
    const filtersKeys = Object.keys(filters || {});
    const localKeys = Object.keys(localFilters || {});
    
    // Sync only if filters are cleared (empty object) or if we're just initializing
    if (filtersKeys.length === 0 && localKeys.length > 0) {
      // Filters were cleared externally
      setLocalFilters({});
    } else if (localKeys.length === 0 && filtersKeys.length > 0) {
      // Initial load - sync filters
      setLocalFilters(filters || {});
    }
    // Don't sync if both have values - user is actively typing
  }, [filters]);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden sticky top-0 self-start" style={{ height: '100vh', maxHeight: '100vh' }}>
      {/* Header - Fixed */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="w-full flex items-center gap-2"
        >
          <RotateCcw className="w-3 h-3" />
          Clear All
        </Button>
      </div>

      {/* Scrollable Filter Categories - Only this section scrolls */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#EF8037 #f1f1f1' }}>
        <div className="px-4 pt-4 pb-4 space-y-6">
          {/* Company Level Filters */}
          <Collapsible open={companyExpanded} onOpenChange={setCompanyExpanded}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
              <span className="font-medium text-gray-900">Company Level</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${companyExpanded ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-3">
              <div className="space-y-2">
                <Label className="text-sm">Revenue</Label>
                <Select value={localFilters.revenue || ''} onValueChange={(value: string) => handleFilterChange('revenue', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select revenue" />
                  </SelectTrigger>
                  <SelectContent>
                    {revenues.map((revenue) => (
                      <SelectItem key={revenue.value} value={revenue.value}>{revenue.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Industry</Label>
                <Select value={localFilters.industry || ''} onValueChange={(value: string) => handleFilterChange('industry', value)}>
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

              <div className="space-y-2">
                <Label className="text-sm">Country</Label>
                <Select value={localFilters.country || ''} onValueChange={(value: string) => handleFilterChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-sm">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="Search company..."
                  value={localFilters.companyName || ''}
                  onChange={(e: { target: { value: string } }) => handleFilterChange('companyName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Employee Size</Label>
                <Select value={localFilters.employeeSize || ''} onValueChange={(value: string) => handleFilterChange('employeeSize', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Apply Button - Inside scrollable area */}
          <div className="pt-4 border-t border-gray-200">
        <Button 
          className="w-full"
          style={{ backgroundColor: hasFilterChanges ? '#EF8037' : '#9CA3AF' }}
          onClick={handleApplyFilters}
          disabled={!hasFilterChanges}
        >
          Apply Filters
        </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

