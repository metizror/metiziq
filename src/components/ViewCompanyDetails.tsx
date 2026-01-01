import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  DollarSign,
  Users,
  BarChart,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";
import { Company, User as UserType, Contact } from "@/types/dashboard.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CountrySelect } from "./CountrySelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteCompanies, getCompanies } from "@/store/slices/companies.slice";
import { getContacts } from "@/store/slices/contacts.slice";
import { privateApiCall } from "@/lib/api";

interface ViewCompanyDetailsProps {
  company: any;
  user: UserType;
  onBack: () => void;
  onExport: (company: Company) => void;
  onCompanyUpdated?: () => void; // Callback to refresh company data after update
}

// Industry and Sub-Industry mapping (same as ContactsTable)
const industrySubIndustryMap: Record<string, string[]> = {
  "Agriculture, Forestry and Fishing": [
    "Commercial Fishing",
    "Crop and Animal Production",
    "Forestry and Logging",
  ],
  "Aerospace and Defense": [
    "Aircraft Engine and Parts Manufacturing",
    "Aircraft Manufacturing",
    "Guided Missile and Space Vehicle Manufacturing",
    "Space Research and Technology",
    "Weapons and Ammunition Manufacturing",
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
    "Trucking",
  ],
  "Banking and Finance": [
    "Banking",
    "Commodities",
    "Exchanges",
    "Holding Companies",
    "Investment Banking",
    "Investment Services",
    "Mortgage and Credit",
    "Securities",
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
    "Computer and Office Machine Repair and Maintenance",
  ],
  Chemicals: [
    "Agricultural Chemical Manufacturing",
    "Basic Chemical Manufacturing",
    "Chemical Wholesale",
    "Miscellaneous Chemical Manufacturing",
    "Paint, Coating, and Adhesive Manufacturing",
    "Synthetic Chemical Manufacturing",
  ],
  "Construction and Building Materials": [
    "Cement and Concrete Product Manufacturing",
    "Civil Engineering",
    "Construction and Hardware Materials Wholesale",
    "Construction Machinery Manufacturing",
    "Residential and Commercial Building Construction",
    "Specialty Construction Trade Contractors",
  ],
  "Consumer Services": [
    "Consumer Goods Rental",
    "Death Care Services",
    "Fitness and Recreation Centers",
    "Laundry Services",
    "Miscellaneous Personal Services",
    "Personal Care Services",
    "Photofinishing",
    "Residential Real Estate Leasing",
  ],
  Education: [
    "Child Day Care Services",
    "Colleges and Universities",
    "Miscellaneous Educational Services",
    "Primary and Secondary Education",
    "Professional and Management Training",
  ],
  Electronics: [
    "Appliance Repair and Maintenance",
    "Audio and Video Equipment Manufacturing",
    "Consumer Electronics Repair and Maintenance",
    "Electrical Equipment and Appliances Manufacturing",
    "Electromedical and Control Instruments Manufacturing",
    "Electronic Equipment Repair and Maintenance",
    "Electronics and Appliances Stores",
    "Electronics Wholesale",
    "Magnetic and Optical Media Manufacturing",
    "Semiconductor and Other Electronic Component Manufacturing",
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
    "Travel and Reservation Services",
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
    "Restaurants and Bars",
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
    "Social and Rehabilitation Services",
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
    "Managed Service Providers (MSPs)",
  ],
  Insurance: [
    "Insurance Agents",
    "Insurance Services",
    "Life and Health Insurance",
    "Pensions and Funds",
    "Property and Casualty Insurance",
  ],
  Manufacturing: [
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
    "Wood Product Manufacturing",
  ],
  "Mining, Quarrying and Drilling": [
    "Coal Mining",
    "Metals Mining",
    "NonMetallic Minerals Mining",
    "Petroleum and Natural Gas Extraction",
    "Support Activities for Mining",
  ],
  "Non-Profit": ["Non-profit Organisations"],
  "Government Administration": [
    "Administration of Public Programs",
    "Courts, Justice and Public Safety",
    "Executive and Legislature",
    "National Security and International Affairs",
    "Space Research and Technology",
    "Local Authorities (Cities, Counties, States)",
  ],
  "Real Estate": [
    "Commercial Real Estate Leasing",
    "Property Managers",
    "Real Estate Agents and Brokers",
    "Real Estate Services",
    "Residential Real Estate Leasing",
  ],
  "Rental and Leasing": [
    "Commercial and Industrial Rental",
    "Commercial Real Estate Leasing",
    "Consumer Goods Rental",
    "Miscellaneous Rental",
    "Motor Vehicle Rental",
    "Residential Real Estate Leasing",
  ],
  Retail: [
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
    "eCommerce",
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
    "Printing",
  ],
  "Utilities and Energy": [
    "Electricity Generation and Distribution",
    "Natural Gas Distribution",
    "Waste Management",
    "Water and Sewage Services",
    "Renweable Energy Services",
    "Petroleum and Natural Gas Extraction",
  ],
  Wholesale: [
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
    "Transportation Equipment Wholesale",
  ],
};

const industries = [
  ...Object.keys(industrySubIndustryMap).map((industry) => ({
    label: industry,
    value: industry,
  })),
  { label: "Other", value: "Other" },
];

// Helper function to format revenue with $ sign
const formatRevenue = (revenue: string | undefined | null): string => {
  if (!revenue || revenue === "-") return "Not Available";

  // If already has $ sign, return as is
  if (revenue.includes("$")) return revenue;

  // Map revenue values to formatted strings
  const revenueMap: { [key: string]: string } = {
    Lessthan1M: "Less than $1M",
    "1Mto5M": "$1M-$5M",
    "5Mto10M": "$5M-$10M",
    "10Mto50M": "$10M-$50M",
    "50Mto100M": "$50M-$100M",
    "100Mto250M": "$100M-$250M",
    "250Mto500M": "$250M-$500M",
    "500Mto1B": "$500M-$1B",
    Morethan1B: "More than $1B",
  };

  // Check if it's a known format
  if (revenueMap[revenue]) {
    return revenueMap[revenue];
  }

  // If it's in format like "1Mto5M" or "1M-5M", add $ signs
  const rangeMatch =
    revenue.match(/^(\d+(?:\.\d+)?[MB]?)to(\d+(?:\.\d+)?[MB]?)$/i) ||
    revenue.match(/^(\d+(?:\.\d+)?[MB]?)-(\d+(?:\.\d+)?[MB]?)$/i);
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

export function ViewCompanyDetails({
  company,
  user,
  onBack,
  onExport,
  onCompanyUpdated,
}: ViewCompanyDetailsProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isDeleting } = useAppSelector((state) => state.companies);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contacts, setContacts] = useState([]);
  console.log("contacts", contacts);
  const [contactsCount, setContactsCount] = useState(0);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const lastFetchedCompanyRef = useRef(null as string | null);

  console.log("company", company);

  // Fetch contacts for this company
  useEffect(() => {
    const fetchCompanyContacts = async () => {
      if (!company.companyName) return;
      if (lastFetchedCompanyRef.current === company.companyName) return;
      lastFetchedCompanyRef.current = company.companyName;

      try {
        setIsLoadingContacts(true);

        // First, get the total count
        const countResponse = await privateApiCall<{
          contacts: any[];
          pagination: {
            totalCount: number;
            totalPages: number;
            currentPage: number;
          };
        }>(
          `/admin/contacts?companyName=${encodeURIComponent(
            company.companyName
          )}&limit=100&page=1`
        );

        const totalCount = countResponse.pagination?.totalCount || 0;
        setContactsCount(totalCount);

        // Fetch all contacts in batches (API max limit is 100)
        const allContacts: any[] = [];
        const totalPages = countResponse.pagination?.totalPages || 1;

        for (let page = 1; page <= totalPages; page++) {
          const response = await privateApiCall<{
            contacts: any[];
            pagination: any;
          }>(
            `/admin/contacts?companyName=${encodeURIComponent(
              company.companyName
            )}&limit=100&page=${page}`
          );

          const mappedContacts: any[] = response.contacts.map(
            (contact: any) => ({
              id: contact._id?.toString() || contact.id,
              firstName: contact.firstName || "",
              lastName: contact.lastName || "",
              email: contact.email || "",
              phone: contact.phone || "",
              // Add other required fields
              jobTitle: contact.jobTitle || "",
              jobLevel: contact.jobLevel || "",
              jobRole: contact.jobRole || "",
              directPhone: contact.directPhone || "",
              address1: contact.address1 || "",
              address2: contact.address2 || "",
              city: contact.city || "",
              state: contact.state || "",
              zipCode: contact.zipCode || "",
              country: contact.country || "",
              website: contact.website || "",
              industry: contact.industry || "",
              linkedInData: contact.linkedInData || null,
              contactLinkedInUrl:
                contact.contactLinkedInUrl || contact.LinkedInUrl || "",
              amfNotes: contact.amfNotes || "",
              lastUpdateDate: contact.lastUpdateDate || "",
              addedBy: contact.addedBy || undefined,
              addedByRole: contact.addedByRole || undefined,
              createdBy: contact.createdBy || undefined,
              addedDate: contact.addedDate || "",
              updatedDate: contact.updatedDate || "",
            })
          );

          allContacts.push(...mappedContacts);
        }

        setContacts(allContacts);
      } catch (error: any) {
        console.error("Failed to fetch contacts:", error);
        setContacts([]);
        setContactsCount(0);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchCompanyContacts();
  }, [company.companyName]);

  const handleDelete = async () => {
    try {
      // Dispatch deleteCompanies action
      await dispatch(deleteCompanies({ ids: [company.id] })).unwrap();

      // Close dialog
      setShowDeleteDialog(false);

      // Show success message
      toast.success("Company deleted successfully");

      // Navigate back to companies list
      onBack();
    } catch (error: any) {
      // Error occurred - show error message
      toast.error(error.message || "Failed to delete company");
      // Keep dialog open so user can retry
    }
  };

  const handleExport = () => {
    onExport(company);
    toast.success("Company exported successfully");
  };

  const handleExportContacts = () => {
    if (contacts.length === 0) {
      toast.info("No contacts available to export");
      return;
    }

    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvHeader =
      "First Name,Last Name,Job Title,Job Level,Job Role,Email,Phone,Direct Phone,Address 1,Address 2,City,State,Zip Code,Country,Website,Industry,Contact LinkedIn URL,aMF Notes,Last Update Date";
    const csvRows = contacts.map((contact: Contact) =>
      [
        escapeCSV(contact.firstName || ""),
        escapeCSV(contact.lastName || ""),
        escapeCSV(contact.jobTitle || ""),
        escapeCSV(contact.jobLevel || ""),
        escapeCSV(contact.jobRole || ""),
        escapeCSV(contact.email || ""),
        escapeCSV(contact.phone || ""),
        escapeCSV(contact.directPhone || ""),
        escapeCSV(contact.address1 || ""),
        escapeCSV(contact.address2 || ""),
        escapeCSV(contact.city || ""),
        escapeCSV(contact.state || ""),
        escapeCSV(contact.zipCode || ""),
        escapeCSV(contact.country || ""),
        escapeCSV(contact.website || ""),
        escapeCSV(contact.industry || ""),
        escapeCSV(contact.contactLinkedInUrl || ""),
        escapeCSV(contact.amfNotes || ""),
        escapeCSV(contact.lastUpdateDate || ""),
      ].join(",")
    );

    const csvContent = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${company.companyName}-contacts.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success(`${contacts.length} contacts exported successfully`);
  };

  // Handle opening edit page
  const handleEditClick = () => {
    const companyId = company.id || (company as any)._id;
    if (companyId) {
      router.push(`/companies/edit/${companyId}`);
    }
  };

  const roleColor = user.role === "superadmin" ? "#2563EB" : "#EB432F";

  // Format address - returns array of address lines
  const formatAddressLines = () => {
    const lines: string[] = [];
    if (company.address1) lines.push(company.address1);
    if (company.address2) lines.push(company.address2);
    const cityStateZip = [company.city, company.state, company.zipCode]
      .filter(Boolean)
      .join(", ");
    if (cityStateZip) lines.push(cityStateZip);
    if (company.country) lines.push(company.country);
    return lines.length > 0 ? lines : ["-"];
  };

  // Format date
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate contact statistics
  const verifiedContactsCount = contacts.filter(
    (contact: Contact) => contact.email && contact.email.trim() !== ""
  ).length;
  const emailContactsCount = contacts.filter(
    (contact: Contact) => contact.email && contact.email.trim() !== ""
  ).length;
  const phoneContactsCount = contacts.filter(
    (contact: Contact) =>
      (contact.phone && contact.phone.trim() !== "") ||
      (contact.directPhone && contact.directPhone.trim() !== "")
  ).length;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-full">
      {/* Top Cream Gradient Banner */}
      <div className="bg-[#FFF8F2] px-8 py-8">
        <div className="">
          {/* Top Row: Navigation Only */}
          <div className="flex items-center justify-start">
            <button
              onClick={onBack}
              className="h-10 w-10  rounded-lg hover:bg-gray-200 cursor-pointer flex items-center justify-center transition-colors"
              type="button"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" strokeWidth={2} />
            </button>
            <h1 className="text-xl font-semibold text-gray-700 ml-4">
              Company detail
            </h1>
          </div>
        </div>
      </div>

      {/* White Section with Overlapping Company Icon and Action Buttons */}
      <div className="w-full px-0 py-50">
        <div className="h-32 bg-gradient-to-r from-orange-100 to-orange-200 "></div>
        <div className="bg-white shadow-sm rounded-b-xl border-b border-x border-gray-200 -mt-12 relative z-10">
          <div className="px-8 py-6">
            <div className=" flex items-center pt-8 justify-between">
              <div className="flex items-center gap-4">
                {/* Company Icon - Overlapping both sections */}
                <div className="w-22 h-22 bg-white rounded-xl border border-gray-200 shadow-sm  absolute left-5 top-0 -translate-y-1/2">
                  <div className="p-2">
                    <div className=" w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Building2 className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col -mt-6">
                  <h2 className="text-2xl font-medium text-gray-900 ">
                    {company.companyName}
                  </h2>
                  <p className="text-lg text-gray-600">
                    {company.allDetails?.industry || "-"}
                  </p>
                </div>
              </div>

              {/* Action Buttons - Right Side */}
              <div className="flex items-center gap-3 -mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <BarChart className="w-4 h-4 text-gray-700" />
                  Analytics
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  className="flex items-center gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 text-gray-700" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {company.companyName}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Company Information Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Company Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* COMPANY DETAILS Column */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-4">
                    COMPANY DETAILS
                  </h4>

                  {/* Company Name with Website - Red Card */}
                  <div className="bg-blue-100 rounded-lg p-4 border border-blue-800 shadow-sm">
                    <div className="text-xs text-blue-800 font-medium mb-1">
                      Company Name
                    </div>
                    <div className="text-base font-medium capitalize text-gray-900 mb-2">
                      {company.companyName}
                    </div>
                    {company.allDetails?.website && (
                      <div className="flex items-center gap-2 mt-2">
                        <Globe className="w-4 h-4 text-gray-600" />
                        <a
                          href={
                            company.allDetails?.website?.startsWith("http")
                              ? company.allDetails?.website
                              : `https://${company.allDetails?.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-800 hover:underline"
                        >
                          {company.allDetails?.website}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                    {/* Revenue - White Card */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 mb-1">Revenue</div>
                      <div className="text-base font-medium capitalize text-gray-900">
                        {formatRevenue(
                          company.allDetails?.annual_revenue_range
                        ) || "-"}
                      </div>
                    </div>

                    {/* Employees - White Card */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 mb-1">
                        Employees
                      </div>
                      <div className="text-base font-medium capitalize text-gray-900">
                        {company.allDetails?.company_size || "-"}
                      </div>
                    </div>

                    {/* Industry - White Card */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 mb-1">Industry</div>
                      <div className="text-base font-medium capitalize text-gray-900">
                        {company.allDetails?.industry || "Not Available"}
                      </div>
                    </div>

                    {/* Last Updated - White Card */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 mb-1">
                        Last Updated
                      </div>
                      <div className="text-base font-medium capitalize text-gray-900">
                        {formatDate(company.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Technology Stack - Light Yellow Card */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 shadow-sm">
                    <div className="text-xs text-yellow-700 font-medium mb-1">
                      Business Model
                    </div>
                    <div className="text-base font-medium capitalize text-gray-900">
                      {company.allDetails?.business_model || "-"}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">
                      Company Email
                    </div>
                    <div className="text-base font-medium capitalize text-gray-900">
                      {company.allDetails?.contact_email || "Not Available"}
                    </div>
                  </div>
                </div>

                {/* LOCATION & ADDITIONAL INFO Column */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-4">
                    LOCATION & ADDITIONAL INFO
                  </h4>

                  {/* Address - Light Mint Green/Teal Card */}
                  <div
                    className="rounded-lg p-4 border border-emerald-200 shadow-sm"
                    style={{ backgroundColor: "#E0F7F2" }}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs text-emerald-700 font-medium mb-1">
                          Address
                        </div>
                        <div className="text-sm text-gray-900 space-y-1">
                          {company.allDetails?.address || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* aMF Notes - Light Yellow Card */}
                  {company.amfNotes && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 shadow-sm">
                      <div className="text-xs text-yellow-700 font-medium mb-2">
                        aMF Notes
                      </div>
                      <div className="text-sm text-gray-900">
                        {company.amfNotes}
                      </div>
                    </div>
                  )}

                  {/* Added/Updated Info - White Card */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        Added by:{" "}
                        <span className="font-medium text-gray-900">
                          {(company as any).createdBy ||
                            company.addedBy ||
                            "Unknown"}
                        </span>
                        {company.addedByRole && (
                          <span className="text-gray-600">
                            {" "}
                            ({company.addedByRole})
                          </span>
                        )}
                      </div>
                      <div>
                        Added on:{" "}
                        <span className="font-medium text-gray-900">
                          {formatDate(company.createdAt)}
                        </span>
                      </div>
                      <div>
                        Updated:{" "}
                        <span className="font-medium text-gray-900">
                          {formatDate(company.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-4">
                    About Company
                  </h4>

                  {/* Address - Light Mint Green/Teal Card */}
                  <div
                    className="rounded-lg p-4 border border-emerald-200 shadow-sm"
                    style={{ backgroundColor: "#E0F7F2" }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="text-xs text-emerald-700 font-medium mb-1">
                          Summary
                        </div>
                        <div className="text-sm text-gray-900 space-y-1">
                          {company.allDetails?.about || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Contacts Section */}

          {/* Company Contacts List Section */}
          {contacts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  All Company Contacts ({contactsCount})
                </h3>

                {isLoadingContacts ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Job Title
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {contacts.map((contact: Contact) => (
                          <tr
                            key={contact.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium text-gray-900">
                                {contact.firstName} {contact.lastName}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-600">
                                {contact?.linkedInData?.person?.headline || "-"}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-600">
                                {contact.email || "-"}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-600">
                                {contact.phone || "-"}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/contacts/${contact.id}`)
                                }
                                className="text-xs"
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 p-8 rounded-xl shadow-lg overflow-hidden relative">
            {/* Content wrapper */}
            <div className="pt-12 pb-8 px-8">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Circular Icon - Diagonal gradient from orange-400 to orange-600 */}
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="w-10 h-10 text-white" strokeWidth={2} />
                </div>

                {/* Available Contacts Label */}
                <div className="inline-block px-4 py-1.5 bg-white rounded-full shadow-sm border border-orange-100 mb-3">
                  <span className="text-xs font-medium text-gray-700">
                    Available Contacts
                  </span>
                </div>

                {/* Contact Count */}
                <div
                  className="text-7xl font-bold"
                  style={{ color: "#2563EB" }}
                >
                  {contactsCount}
                </div>

                {/* Company Name Text - Single line with company name in orange */}
                <div className="text-sm text-gray-700 ">
                  Contacts Available for{" "}
                  <span className="font-semibold" style={{ color: "#2563EB" }}>
                    {company.companyName}
                  </span>
                </div>

                {/* Filter Buttons - Rounded full with orange border */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <div className=" px-4 py-1.5 bg-white flex rounded-full shadow-sm border border-orange-100 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Verified
                    </span>
                  </div>
                  <div className="px-4 py-1.5 bg-white rounded-full flex shadow-sm border border-orange-100 mb-3 flex items-center gap-2">
                    <Mail
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "#2563EB" }}
                      strokeWidth={1.5}
                      fill="none"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Email Contacts
                    </span>
                  </div>
                  <div className=" px-4 py-1.5 bg-white rounded-full shadow-sm border border-orange-100 mb-3 flex items-center gap-2">
                    <Phone
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "#2563EB" }}
                      strokeWidth={1.5}
                      fill="none"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Phone Contacts
                    </span>
                  </div>
                </div>

                {/* Download Button - Horizontal gradient from orange-500 to orange-600 */}
                {/* <div className="pt-4 w-full max-w-md">
                  <Button
                    onClick={handleExportContacts}
                    disabled={contactsCount === 0 || isLoadingContacts}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-6 text-base shadow-md rounded-lg"
                  >
                    <Download className="w-5 h-5 mr-2" strokeWidth={2} />
                    Download All Contacts
                  </Button>
                </div> */}
              </div>
            </div>

            {/* Thin orange gradient line at bottom edge (1-2px) - vibrant medium orange to deeper orange */}
            <div className="h-0.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700"></div>
          </div>

          {contacts.length === 0 && !isLoadingContacts && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No contacts found for this company.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {company.companyName}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
