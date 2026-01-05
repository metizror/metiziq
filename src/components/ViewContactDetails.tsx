import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Building2,
  Briefcase,
  Globe,
  Linkedin,
  DollarSign,
  Users,
  BarChart,
  Star,
  X,
} from "lucide-react";
import { Contact, User as UserType, Company } from "@/types/dashboard.types";
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
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  updateContact,
  deleteContacts,
  setPendingFilters,
} from "@/store/slices/contacts.slice";
import { useRouter } from "next/navigation";
import { privateApiCall } from "@/lib/api";
import blueLogo from "../assets/Twitter_Verified_Badge.svg.png";
import grayLogo from "../assets/Twitter_Verified_Badge_Gray.svg.png";
import banner from "../assets/banner.jpg";

interface ViewContactDetailsProps {
  contact: Contact;
  user: UserType;
  onBack: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onExport: (contact: Contact) => void;
  companyName?: string;
  company?: Company;
  onContactUpdated?: () => void; // Callback to refresh contact data after update
}

// Helper function to format LinkedIn URL with protocol
const formatLinkedInUrl = (url: string | undefined | null): string => {
  if (!url || !url.trim()) return "";

  const trimmedUrl = url.trim();

  // If URL already has a protocol, return as is
  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }

  // If URL starts with www. or linkedin.com, prepend https://
  if (trimmedUrl.startsWith("www.") || trimmedUrl.startsWith("linkedin.com")) {
    return `https://${trimmedUrl}`;
  }

  // For any other case, prepend https://
  return `https://${trimmedUrl}`;
};

const formatWebsiteUrl = (url: string | undefined | null): string => {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/\//, "")}`;
};

// Helper function to format revenue with $ sign
const formatRevenue = (revenue: string | undefined | null): string => {
  if (!revenue || revenue === "-") return "-";

  // If already has $ sign, return as is
  if (revenue.includes("$")) return revenue;

  // Map revenue values to formatted strings
  const revenueMap: { [key: string]: string } = {
    "Less-than-1M": "Less than $1M",
    "1M-5M": "$1M-$5M",
    "5M-10M": "$5M-$10M",
    "10M-50M": "$10M-$50M",
    "50M-100M": "$50M-$100M",
    "100M-250M": "$100M-$250M",
    "250M-500M": "$250M-$500M",
    "500M-1B": "$500M-$1B",
    "More-than-1B": "More than $1B",
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

const WhatsAppIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const renderValueWithLinks = (text: string) => {
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {match[1]}
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

const formatRecordInfo = (text: string | null | undefined) => {
  if (!text)
    return (
      <p className="text-gray-500 italic">No record information available.</p>
    );

  // Split text by bold markers (**text**)
  const parts = text.split("**");

  // If no structure found, return formatted text
  if (parts.length === 1) {
    return <p className="text-gray-700 whitespace-pre-line">{text}</p>;
  }

  const items = [];
  // First part is usually intro text
  const intro = parts[0].trim();

  // Iterate through parts: odd indices are keys (inside **), even are values
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i].replace(/:$/, "").trim();
    // The value follows immediately after the key's closing **
    let value = parts[i + 1] ? parts[i + 1].trim() : "";

    // Clean up value: remove leading colon if present closer to the split
    if (value.startsWith(":")) {
      value = value.substring(1).trim();
    }
    // Remove trailing asterisks if any
    value = value.replace(/\*+$/, "").trim();

    if (key) {
      items.push(
        <div
          key={i}
          className="flex flex-col gap-1 text-sm p-3 bg-gray-50 rounded-lg border border-gray-100"
        >
          <span className="font-semibold text-gray-900">{key}</span>
          <span className="text-gray-700 break-words">
            {renderValueWithLinks(value)}
          </span>
        </div>
      );
    }
  }

  return (
    <div className="space-y-4">
      {intro && (
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic mb-4">
          {renderValueWithLinks(intro)}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{items}</div>
    </div>
  );
};

export function ViewContactDetails({
  contact,
  user,
  onBack,
  onEdit,
  onDelete,
  onExport,
  companyName,
  company,
  onContactUpdated,
}: ViewContactDetailsProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isUpdating, isDeleting } = useAppSelector((state) => state.contacts);
  const { companies: reduxCompanies } = useAppSelector(
    (state) => state.companies
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const resolvedCompanyName =
    contact.linkedInData?.extractedProfileData?.company_details?.company_name ||
    "-";
  // Try to find company ID from multiple sources
  let resolvedCompanyId =
    company?.id || (company as any)?._id || contact.companyId;

  // If company ID is not found, try to find it from Redux companies store by company name
  if (
    !resolvedCompanyId &&
    resolvedCompanyName &&
    resolvedCompanyName !== "-"
  ) {
    const foundCompany = reduxCompanies.find((c: Company) => {
      const cName = c.companyName?.toLowerCase().trim();
      const searchName = resolvedCompanyName.toLowerCase().trim();
      return cName === searchName;
    });
    if (foundCompany) {
      resolvedCompanyId = foundCompany.id || (foundCompany as any)?._id;
    }
  }

  const handleCompanyNavigation = async () => {
    if (resolvedCompanyId) {
      router.push(`/companies/${resolvedCompanyId}`);
      return;
    }

    if (!resolvedCompanyName || resolvedCompanyName === "-") {
      return;
    }

    try {
      // First check Redux store one more time
      let foundCompany = reduxCompanies.find((c: Company) => {
        const cName = c.companyName?.toLowerCase().trim();
        const searchName = resolvedCompanyName.toLowerCase().trim();
        return cName === searchName;
      });

      if (foundCompany) {
        const companyId = foundCompany.id || (foundCompany as any)?._id;
        if (companyId) {
          router.push(`/companies/${companyId}`);
          return;
        }
      }

      // If not found in Redux, fetch from API
      toast.loading("Finding company...", { id: "company-search" });

      let page = 1;
      const limit = 100;
      let companyFound = false;

      while (!companyFound && page <= 10) {
        // Limit to 10 pages for safety
        try {
          const response = await privateApiCall<{
            companies: any[];
            pagination: any;
          }>(
            `/admin/companies?page=${page}&limit=${limit}&companyName=${encodeURIComponent(
              resolvedCompanyName
            )}`
          );

          // Find exact match (case-insensitive)
          const exactMatch = response.companies.find((c: any) => {
            const cName = c.companyName?.toLowerCase().trim();
            const searchName = resolvedCompanyName.toLowerCase().trim();
            return cName === searchName;
          });

          if (exactMatch) {
            const companyId =
              exactMatch._id?.toString() || exactMatch.id?.toString();
            if (companyId) {
              toast.dismiss("company-search");
              router.push(`/companies/${companyId}`);
              companyFound = true;
              return;
            }
          }

          // If no more pages, stop searching
          if (page >= response.pagination.totalPages) {
            break;
          }

          page++;
        } catch (error) {
          console.error("Error fetching companies:", error);
          break;
        }
      }

      toast.dismiss("company-search");

      if (!companyFound) {
        toast.error(
          "Company not found. Please try navigating from the Companies page."
        );
      }
    } catch (error: any) {
      toast.dismiss("company-search");
      console.error("Error navigating to company:", error);
      toast.error(
        "Failed to find company. Please try navigating from the Companies page."
      );
    }
  };

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

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    jobLevel: "",
    jobRole: "",
    email: "",
    phone: "",
    directPhone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    website: "",
    industry: "",
    subIndustry: "",
    contactLinkedIn: "",
    amfNotes: "",
    lastUpdateDate: "",
    companyName: "",
    employeeSize: "",
    revenue: "",
  });

  const handleDelete = async () => {
    try {
      // Dispatch deleteContacts action
      await dispatch(deleteContacts({ ids: [contact.id] })).unwrap();

      // Close dialog
      setShowDeleteDialog(false);

      // Show success message
      toast.success("Contact deleted successfully");

      // Navigate back to contacts list
      onBack();
    } catch (error: any) {
      // Error occurred - show error message
      toast.error(error.message || "Failed to delete contact");
      // Keep dialog open so user can retry
    }
  };

  const handleExport = () => {
    onExport(contact);
    toast.success("Contact exported successfully");
  };

  const roleColor = user.role === "superadmin" ? "#2563EB" : "#EB432F";

  // Helper function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Helper functions for normalization (same as ContactsTable)
  const normalizeRevenue = (value: string | undefined): string => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";

    // Valid Revenue options - exact values as they appear in SelectItem (new format with "to")
    const validRevenues = [
      "Lessthan1M",
      "1Mto5M",
      "5Mto10M",
      "10Mto50M",
      "50Mto100M",
      "100Mto250M",
      "250Mto500M",
      "500Mto1B",
      "Morethan1B",
    ];

    // First check for exact match (case-sensitive) - new format
    const exactMatch = validRevenues.find((rev) => rev === trimmed);
    if (exactMatch) return exactMatch;

    // Handle old format - convert to new format
    const oldToNewMap: { [key: string]: string } = {
      "Less-than-1M": "Lessthan1M",
      "1M-5M": "1Mto5M",
      "5M-10M": "5Mto10M",
      "10M-50M": "10Mto50M",
      "50M-100M": "50Mto100M",
      "100M-250M": "100Mto250M",
      "250M-500M": "250Mto500M",
      "500M-1B": "500Mto1B",
      "More-than-1B": "Morethan1B",
    };

    if (oldToNewMap[trimmed]) return oldToNewMap[trimmed];

    // Handle special cases - remove $ signs and convert to new format
    if (
      trimmed === "Less than $1M" ||
      trimmed.toLowerCase() === "less than $1m" ||
      trimmed === "Less-than-$1M"
    )
      return "Lessthan1M";
    if (
      trimmed === "More than $1B" ||
      trimmed.toLowerCase() === "more than $1b" ||
      trimmed === "More-than-$1B"
    )
      return "Morethan1B";

    // Remove $ signs and replace " to " or "-" with "to"
    let normalized = trimmed
      .replace(/\$/g, "")
      .replace(/\s+to\s+/gi, "to")
      .replace(/-/g, "to");

    // Check if normalized value matches any valid option
    const normalizedMatch = validRevenues.find((rev) => rev === normalized);
    if (normalizedMatch) return normalizedMatch;

    return "";
  };

  const normalizeEmployeeSize = (value: string | undefined): string => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";

    // Valid Employee Size options - exact values as they appear in SelectItem (new format with "to")
    const validSizes = [
      "1to25",
      "26to50",
      "51to100",
      "101to250",
      "251to500",
      "501to1000",
      "1001to2500",
      "2501to5000",
      "5001to10000",
      "over10001",
    ];

    // First check for exact match (case-sensitive) - new format
    const exactMatch = validSizes.find((size) => size === trimmed);
    if (exactMatch) return exactMatch;

    // Handle old format - convert to new format
    const oldToNewMap: { [key: string]: string } = {
      "1-25": "1to25",
      "26-50": "26to50",
      "51-100": "51to100",
      "101-250": "101to250",
      "251-500": "251to500",
      "501-1000": "501to1000",
      "1001-2500": "1001to2500",
      "2501-5000": "2501to5000",
      "5001-10000": "5001to10000",
      "over-10001": "over10001",
    };

    if (oldToNewMap[trimmed]) return oldToNewMap[trimmed];

    // Handle special case
    if (trimmed === "over 10,001" || trimmed.toLowerCase() === "over 10,001")
      return "over10001";

    // Remove spaces and replace " to " or "-" with "to"
    let normalized = trimmed
      .replace(/\s+to\s+/gi, "to")
      .replace(/-/g, "to")
      .replace(/\s+/g, "");

    // Check if normalized value matches any valid option
    const normalizedMatch = validSizes.find((size) => size === normalized);
    if (normalizedMatch) return normalizedMatch;

    return "";
  };

  const normalizeJobLevel = (value: string | undefined): string => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    const validLevels = [
      "Analyst",
      "Below Manager",
      "C-Level",
      "Developer",
      "Director",
      "Engineer",
      "General Manager",
      "Manager",
      "Managing Director",
      "Vice President",
      "Architect",
    ];
    const matched = validLevels.find(
      (level) => level.toLowerCase() === trimmed.toLowerCase()
    );
    if (matched) return matched;
    const exactMatch = validLevels.find((level) => level === trimmed);
    return exactMatch || "";
  };

  const normalizeJobRole = (value: string | undefined): string => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    const validRoles = [
      "Administration",
      "Business Development",
      "Client Management",
      "Customer Experience",
      "Customer Success",
      "Data & Analytics",
      "Demand Generation",
      "Engineering",
      "Finance",
      "Growth",
      "Human Resources",
      "Information Technology",
      "Legal",
      "Manufacturing",
      "Marketing",
      "Operations",
      "Others",
      "Procurement / Sourcing / Supply Chain",
      "Product",
      "Quality",
      "Risk & Compliance",
      "Sales",
      "Sales & Marketing",
      "Strategy",
      "Underwriting",
    ];
    const exactMatch = validRoles.find((role) => role === trimmed);
    if (exactMatch) return exactMatch;
    const caseInsensitiveMatch = validRoles.find(
      (role) => role.toLowerCase() === trimmed.toLowerCase()
    );
    if (caseInsensitiveMatch) return caseInsensitiveMatch;
    return "";
  };

  const normalizeIndustry = (value: string | undefined): string => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    const matched = industries.find(
      (industry) =>
        industry.value.toLowerCase() === trimmed.toLowerCase() ||
        industry.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (matched) return matched.value;
    const exactMatch = industries.find(
      (industry) => industry.value === trimmed || industry.label === trimmed
    );
    return exactMatch ? exactMatch.value : "";
  };

  // Handle opening edit page
  const handleEditClick = () => {
    // Navigate to edit page instead of opening modal
    const contactId = contact.id || (contact as any)._id;
    if (contactId) {
      router.push(`/contacts/edit/${contactId}`);
    }
  };

  // Handle update contact
  const handleUpdateContact = async () => {
    if (!editForm.firstName || !editForm.lastName) {
      toast.error("Please enter first and last name");
      return;
    }

    if (!editForm.companyName || !editForm.employeeSize || !editForm.revenue) {
      toast.error("Company Name, Employee Size, and Revenue are required");
      return;
    }

    try {
      const payload = {
        id: contact.id,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        jobTitle: editForm.jobTitle || undefined,
        jobLevel: editForm.jobLevel || undefined,
        jobRole: editForm.jobRole || undefined,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        directPhone: editForm.directPhone || undefined,
        address1: editForm.address1 || undefined,
        address2: editForm.address2 || undefined,
        city: editForm.city || undefined,
        state: editForm.state || undefined,
        zipCode: editForm.zipCode || undefined,
        country: editForm.country || undefined,
        website: editForm.website || undefined,
        industry: editForm.industry || undefined,
        subIndustry: editForm.subIndustry || undefined,
        contactLinkedIn: editForm.contactLinkedIn || undefined,
        lastUpdateDate: editForm.lastUpdateDate || undefined,
        companyName: editForm.companyName || undefined,
        employeeSize: editForm.employeeSize || undefined,
        revenue: editForm.revenue || undefined,
        amfNotes: editForm.amfNotes || undefined,
      };

      await dispatch(updateContact(payload)).unwrap();

      setIsEditDialogOpen(false);
      toast.success("Contact updated successfully");

      // Call callback to refresh contact data
      if (onContactUpdated) {
        onContactUpdated();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update contact");
    }
  };

  // Render form fields for edit dialog
  const renderEditFormFields = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        <div className="space-y-2">
          <Label htmlFor="edit-firstName">First Name *</Label>
          <Input
            id="edit-firstName"
            value={editForm.firstName}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, firstName: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-lastName">Last Name *</Label>
          <Input
            id="edit-lastName"
            value={editForm.lastName}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, lastName: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-jobTitle">Job Title</Label>
          <Input
            id="edit-jobTitle"
            value={editForm.jobTitle}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, jobTitle: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Job Level</Label>
          <Select
            value={editForm.jobLevel || ""}
            onValueChange={(value: string) =>
              setEditForm({ ...editForm, jobLevel: value })
            }
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
              <SelectItem value="Managing Director">
                Managing Director
              </SelectItem>
              <SelectItem value="Vice President">Vice President</SelectItem>
              <SelectItem value="Architect">Architect</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Job Role</Label>
          <Select
            value={editForm.jobRole || ""}
            onValueChange={(value: string) =>
              setEditForm({ ...editForm, jobRole: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Administration">Administration</SelectItem>
              <SelectItem value="Business Development">
                Business Development
              </SelectItem>
              <SelectItem value="Client Management">
                Client Management
              </SelectItem>
              <SelectItem value="Customer Experience">
                Customer Experience
              </SelectItem>
              <SelectItem value="Customer Success">Customer Success</SelectItem>
              <SelectItem value="Data & Analytics">Data & Analytics</SelectItem>
              <SelectItem value="Demand Generation">
                Demand Generation
              </SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Growth">Growth</SelectItem>
              <SelectItem value="Human Resources">Human Resources</SelectItem>
              <SelectItem value="Information Technology">
                Information Technology
              </SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Others">Others</SelectItem>
              <SelectItem value="Procurement / Sourcing / Supply Chain">
                Procurement / Sourcing / Supply Chain
              </SelectItem>
              <SelectItem value="Product">Product</SelectItem>
              <SelectItem value="Quality">Quality</SelectItem>
              <SelectItem value="Risk & Compliance">
                Risk & Compliance
              </SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Sales & Marketing">
                Sales & Marketing
              </SelectItem>
              <SelectItem value="Strategy">Strategy</SelectItem>
              <SelectItem value="Underwriting">Underwriting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-email">Email</Label>
          <Input
            id="edit-email"
            type="email"
            value={editForm.email}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, email: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-phone">Phone</Label>
          <Input
            id="edit-phone"
            value={editForm.phone}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, phone: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-directPhone">Direct Phone</Label>
          <Input
            id="edit-directPhone"
            value={editForm.directPhone}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, directPhone: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-address1">Address 1</Label>
          <Input
            id="edit-address1"
            value={editForm.address1}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, address1: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-address2">Address 2</Label>
          <Input
            id="edit-address2"
            value={editForm.address2}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, address2: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-city">City</Label>
          <Input
            id="edit-city"
            value={editForm.city}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, city: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-state">State</Label>
          <Input
            id="edit-state"
            value={editForm.state}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, state: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-zipCode">Zip Code</Label>
          <Input
            id="edit-zipCode"
            value={editForm.zipCode}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, zipCode: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-country">Country</Label>
          <Input
            id="edit-country"
            value={editForm.country}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, country: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-website">Website</Label>
          <Input
            id="edit-website"
            value={editForm.website}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, website: e.target.value })
            }
            placeholder="https://example.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Industry</Label>
          <Select
            value={editForm.industry || ""}
            onValueChange={(value: string) => {
              setEditForm({ ...editForm, industry: value, subIndustry: "" });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry.value} value={industry.value}>
                  {industry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {editForm.industry && (
          <div className="space-y-2">
            <Label>Sub-Industry</Label>
            {editForm.industry === "Other" ? (
              <Input
                value={editForm.subIndustry || ""}
                onChange={(e: { target: { value: string } }) =>
                  setEditForm({ ...editForm, subIndustry: e.target.value })
                }
                placeholder="Enter sub-industry"
              />
            ) : industrySubIndustryMap[editForm.industry] ? (
              <Select
                value={editForm.subIndustry || ""}
                onValueChange={(value: string) =>
                  setEditForm({ ...editForm, subIndustry: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-industry" />
                </SelectTrigger>
                <SelectContent>
                  {industrySubIndustryMap[editForm.industry].map(
                    (subIndustry) => (
                      <SelectItem key={subIndustry} value={subIndustry}>
                        {subIndustry}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="edit-contactLinkedIn">Contact LinkedIn URL</Label>
          <Input
            id="edit-contactLinkedIn"
            value={editForm.contactLinkedIn}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, contactLinkedIn: e.target.value })
            }
            placeholder="https://linkedin.com/in/username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-lastUpdateDate">Last Update Date</Label>
          <Input
            id="edit-lastUpdateDate"
            type="date"
            value={editForm.lastUpdateDate}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, lastUpdateDate: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-2">
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-4">
              Company Information
            </h3>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-companyName">Company Name *</Label>
          <Input
            id="edit-companyName"
            value={editForm.companyName}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, companyName: e.target.value })
            }
            placeholder="Enter company name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-employeeSize">Employee Size *</Label>
          <Select
            value={editForm.employeeSize || ""}
            onValueChange={(value: string) =>
              setEditForm({ ...editForm, employeeSize: value })
            }
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
          <Label htmlFor="edit-revenue">Revenue *</Label>
          <Select
            value={editForm.revenue || ""}
            onValueChange={(value: string) =>
              setEditForm({ ...editForm, revenue: value })
            }
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
          <Label htmlFor="edit-amfNotes">aMF Notes</Label>
          <Textarea
            id="edit-amfNotes"
            value={editForm.amfNotes}
            onChange={(e: { target: { value: string } }) =>
              setEditForm({ ...editForm, amfNotes: e.target.value })
            }
            rows={3}
            placeholder="Additional notes about the contact..."
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-full">
      {/* Thin dark brown top bar */}
      {/* <div className="h-1" style={{ backgroundColor: '#8B4513' }}></div>   */}

      {/* Header with Actions */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="h-10 w-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              style={{ color: "#374151" }}
              type="button"
            >
              <ArrowLeft
                className="h-5 w-5"
                style={{ color: "#374151", strokeWidth: 2 }}
              />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Contact Details
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View and manage contact information
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 text-gray-700" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={handleEditClick}
              className="flex items-center gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 text-gray-700" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 bg-red-600 border-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 text-white" />
              Delete
            </Button>

            <AlertDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {contact.firstName}{" "}
                    {contact.lastName}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Profile Banner */}
            {/* <div
              className="h-32 w-full bg-gray-100 bg-cover bg-center bg-repeat"
              style={{
                backgroundImage: (contact as any).linkedInData?.backgroundUrl
                  ? `url(${(contact as any).linkedInData.backgroundUrl})`
                  : 'linear-gradient(to right, #f3f4f6, #e5e7eb)'
              }}
            /> */}
            <img
              src={
                (contact as any).linkedInData?.person?.backgroundUrl ??
                banner.src
              }
              alt="image"
              className="w-full h-[180px] object-cover"
              style={{
                objectFit: "fill",
                width: "100%",
                height: "180px",
                objectPosition: "center",
              }}
            />

            <div className="avtarTitle px-8 pb-8 relative">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <Avatar className="avtarLogo h-24 w-24 border-4 border-white shadow-lg -mt-12 bg-white  absolute left-20 translate-y-[-50%] z-10">
                  {(contact as any).linkedInData?.person?.photoUrl && (
                    <AvatarImage
                      src={(contact as any).linkedInData?.person?.photoUrl}
                      alt={`${contact.firstName} ${contact.lastName}`}
                    />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white text-2xl font-semibold">
                    {getInitials(contact.firstName, contact.lastName)}
                  </AvatarFallback>
                </Avatar>

                {/* Name and Basic Info */}
                <div className="flex-1 pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        {contact.firstName ||
                          contact.linkedInData?.person?.firstName}{" "}
                        {contact.lastName ||
                          contact.linkedInData?.person?.lastName}
                      </h2>
                      <p className="text-lg text-gray-700 mb-3">
                        {contact.linkedInData?.person?.headline || "-"}
                      </p>
                      <div className="flex items-center gap-2">
                        {contact.jobLevel && (
                          <Badge
                            variant="secondary"
                            className="bg-purple-100 text-purple-800 border-0 rounded-full px-3 py-1"
                          >
                            {contact.jobLevel}
                          </Badge>
                        )}
                        {contact.jobRole && (
                          <Badge
                            variant="secondary"
                            className="bg-purple-100 text-purple-800 border-0 rounded-full px-3 py-1"
                          >
                            {contact.jobRole}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">
                        Verified On
                      </div>
                      <div className="font-semibold text-gray-900">
                        {contact?.syncDate
                          ? new Date(contact.syncDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "Pending"}
                      </div>
                    </div>
                  </div>

                  {/* Quick Contact Info */}
                  <div className="grid gap-4 mt-6">
                    {contact.email && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 w-fit">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0 ">
                          <div className="text-xs text-blue-700 mb-1 font-medium">
                            Email
                          </div>
                          <div className="text-sm text-gray-900 truncate flex items-center gap-2 font-medium">
                            {contact.email}
                            {contact.email && (
                              <img
                                src={
                                  contact.isEmailVerified
                                    ? blueLogo.src
                                    : grayLogo.src
                                }
                                alt={
                                  contact.isEmailVerified
                                    ? "Verified"
                                    : "Unverified"
                                }
                                className="w-6 h-6"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* {contact.phone && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-green-700 mb-1 font-medium">Phone</div>
                          <div className="text-sm text-gray-900 font-medium">{contact.phone}</div>
                        </div>
                      </div>
                    )} */}
                    {/* {(contact.city || contact.state) && (
                      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MapPin className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-purple-700 mb-1 font-medium">Location</div>
                          <div className="text-sm text-gray-900 font-medium">
                            {contact.city || ''}{contact.city && contact.state ? ', ' : ''}{contact.state || ''}
                          </div>
                        </div>
                      </div>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Contact Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Personal and professional contact details
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Contact Name */}
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Contact Name
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {contact.firstName ||
                        contact.linkedInData?.person?.firstName ||
                        contact.linkedInData?.extractedProfileData
                          ?.person_details?.personaName}{" "}
                      {contact.lastName ||
                        contact.linkedInData?.person?.lastName}
                    </div>
                  </div>
                </div>

                {/* Job Title */}
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Job Title
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {contact.linkedInData?.extractedProfileData
                        ?.person_details?.job_title || "-"}
                    </div>
                  </div>
                </div>

                {/* Job Level */}
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <BarChart className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Job Level
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {contact.linkedInData?.extractedProfileData
                        ?.person_details?.job_level || "-"}
                    </div>
                  </div>
                </div>

                {/* Role/Department */}
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Role/Department
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {contact.linkedInData?.extractedProfileData
                        ?.person_details?.role || "-"}
                    </div>
                  </div>
                </div>

                {/* Email ID */}
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <Mail className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">Email Id</div>
                    {contact.email ? (
                      <div className="text-sm font-medium text-gray-900 break-all">
                        {contact.email}
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-gray-400">-</div>
                    )}
                  </div>
                </div>

                {/* Phone# */}
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="text-xs text-gray-500">Phone</div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            const phoneNumber =
                              contact.linkedInData?.extractedProfileData?.person_details?.phone?.replace(
                                /\D/g,
                                ""
                              );
                            if (phoneNumber) {
                              window.open(
                                `https://web.whatsapp.com/send?phone=${phoneNumber}`,
                                "_blank"
                              );
                            }
                          }}
                          className="bg-green-100 hover:bg-green-200 text-green-700 p-1 rounded transition-colors"
                          title="Connect on WhatsApp"
                        >
                          <WhatsAppIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            (window.location.href = `tel:${contact.linkedInData?.extractedProfileData?.person_details?.phone}`)
                          }
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-1 rounded transition-colors"
                          title="Call Now"
                        >
                          <Phone className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {contact.linkedInData?.extractedProfileData
                        ?.person_details?.phone || "-"}
                    </div>
                  </div>
                </div>

                {/* Direct / Mobile# */}
                {contact.directPhone && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      <Phone className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">
                        Direct / Mobile#
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {contact.directPhone}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact LinkedIn */}
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <Linkedin className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">
                      LinkedIn URL
                    </div>
                    {(contact as any).linkedInData?.person?.linkedInUrl ? (
                      <div className="text-sm font-medium text-blue-600">
                        <a
                          href={formatLinkedInUrl(
                            contact.contactLinkedIn ||
                              (contact as any).linkedInData?.person?.linkedInUrl
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline break-all"
                        >
                          {(contact as any).linkedInData?.person?.linkedInUrl}
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-gray-400">-</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Experience
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {contact.linkedInData?.extractedProfileData
                        ?.person_details?.experience || "-"}
                    </div>
                  </div>
                </div>

                {/* <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"> */}
                {/* Icon */}
                {/* <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50"> */}
                {/* <Briefcase className="h-4 w-4 text-indigo-600" /> */}
                {/* </div> */}

                {/* Content */}
                {/* <div className="flex-1 min-w-0"> */}
                {/* <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500"> */}
                {/* What we can sell */}
                {/* </div> */}

                {/* <ul className="space-y-2"> */}
                {/* {contact.linkedInData?.extractedProfileData
                        ?.person_details?.personSalesStrategyReportDataMeta?.map
                        ?.length > 0 ? (
                        contact.linkedInData.extractedProfileData.person_details.personSalesStrategyReportDataMeta.map(
                          (item: any, index: number) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                              <span className="leading-snug">{item}</span>
                            </li>
                          )
                        )
                      ) : (
                        <li className="text-sm text-gray-400">-</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <Star className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Google Reviews
                    </div>
                    <div className="text-sm font-medium text-gray-900 space-y-2">
                      {contact.linkedInData?.extractedProfileData?.person_details?.google_reviews?.map(
                        (review: any, index: number) => {
                          const sitename =
                            review.sitename ||
                            review.Sitename ||
                            review.site ||
                            "";
                          const rating = review.rating || review.Rating || "";
                          const formattedText =
                            sitename && rating
                              ? `${sitename} - ${rating}`
                              : Object.entries(review)
                                  .map(
                                    ([key, value]: [string, any]) =>
                                      `${key}: ${value}`
                                  )
                                  .join(", ");

                          return (
                            <div
                              key={index}
                              className="border-b pb-2 last:border-b-0"
                            >
                              {formattedText}
                            </div>
                          );
                        }
                      ) || "-"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="mt-0.5">
                    <Star className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Other Trusted Reviews
                    </div>
                    <div className="text-sm font-medium text-gray-900 space-y-2">
                      {contact.linkedInData?.extractedProfileData?.person_details?.other_trusted_reviews?.map(
                        (review: any, index: number) => {
                          const sitename =
                            review.sitename ||
                            review.Sitename ||
                            review.site ||
                            "";
                          const rating = review.rating || review.Rating || "";
                          const formattedText =
                            sitename && rating
                              ? `${sitename} - ${rating}`
                              : Object.entries(review)
                                  .map(
                                    ([key, value]: [string, any]) =>
                                      `${key}: ${value}`
                                  )
                                  .join(", ");

                          return (
                            <div
                              key={index}
                              className="border-b pb-2 last:border-b-0"
                            >
                              {formattedText}
                            </div>
                          );
                        }
                      ) || "-"}
                    </div>
                  </div>
                </div> */}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  What we can sell to this contact
                </div>

                <ul className="space-y-2 grid grid-cols-2 gap-2">
                  {contact.linkedInData?.extractedProfileData?.person_details
                    ?.personSalesStrategyReportDataMeta?.map?.length > 0 ? (
                    contact.linkedInData.extractedProfileData.person_details.personSalesStrategyReportDataMeta.map(
                      (item: any, index: number) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      )
                    )
                  ) : (
                    <li className="text-sm text-gray-400">-</li>
                  )}
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-4">
                <h3 className="flex text-lg font-semibold text-gray-900 mb-4">
                  Metizsoft {<X />} {contact.firstName || contact.linkedInData?.person?.firstName || contact.linkedInData?.extractedProfileData?.person_details?.personaName} {contact.lastName || contact.linkedInData?.person?.lastName}
                </h3>
                <div className="col-span-full">
                  {contact.linkedInData?.extractedProfileData?.person_details
                    ?.personSalesStrategyMailContent ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          contact.linkedInData.extractedProfileData
                            .person_details.personSalesStrategyMailContent,
                      }}
                      className="prose prose-sm max-w-none text-gray-700 
                          [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h1]:text-gray-900
                          [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mb-3 [&>h2]:mt-5 [&>h2]:text-gray-900
                          [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>h3]:mt-4 [&>h3]:text-gray-900
                          [&>p]:mb-4 [&>p]:leading-relaxed [&>p]:text-gray-700
                          [&>ul]:mb-4 [&>ul]:ml-6 [&>ul]:list-disc [&>ul]:space-y-2
                          [&>ol]:mb-4 [&>ol]:ml-6 [&>ol]:list-decimal [&>ol]:space-y-2
                          [&>li]:mb-1 [&>li]:leading-relaxed
                          [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4 [&>blockquote]:text-gray-600
                          [&>strong]:font-semibold [&>strong]:text-gray-900
                          [&>em]:italic
                          [&>a]:text-blue-600 [&>a]:hover:text-blue-800 [&>a]:underline
                          space-y-4"
                    />
                  ) : (
                    <p className="text-gray-500 italic">-</p>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  About the Contact
                </h3>
                <div className="col-span-full">
                  {formatRecordInfo(
                    contact.linkedInData?.extractedProfileData?.person_details
                      ?.about
                  ) || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          {/* {(companyName || company || contact.companyName) && ( */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Company Information
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Organization and business details
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Company Name */}
                  {resolvedCompanyName && resolvedCompanyName !== "-" ? (
                    <div
                      onClick={handleCompanyNavigation}
                      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 text-left w-full transition-all hover:border-orange-400 hover:shadow-md focus:outline-none focus:ring-orange-300 group cursor-pointer"
                    >
                      <div className="mt-0.5">
                        <Building2 className="w-4 h-4 text-gray-500 group-hover:text-orange-500 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5">
                          Company Name
                        </div>
                        <div className="text-sm font-medium text-black break-all transition-colors group-hover:text-orange-600">
                          {contact.linkedInData?.extractedProfileData
                            ?.company_details?.company_name || "-"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="mt-0.5">
                        <Building2 className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5">
                          Company Name
                        </div>
                        <div className="text-sm font-medium text-gray-400">
                          -
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      <Globe className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">
                        Website
                      </div>
                      {contact?.linkedInData?.extractedProfileData
                        ?.company_details?.website || contact.website ? (
                        <a
                          href={formatWebsiteUrl(
                            contact?.linkedInData?.extractedProfileData
                              ?.company_details?.website || contact.website
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline break-all"
                        >
                          {contact?.linkedInData?.extractedProfileData
                            ?.company_details?.website || contact.website}
                        </a>
                      ) : (
                        <div className="text-sm font-medium text-gray-400">
                          -
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Industry */}
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">
                        Industry
                      </div>
                      <div className="text-sm font-medium text-gray-900 leading-relaxed">
                        {(() => {
                          const industryText =
                            contact?.linkedInData?.extractedProfileData
                              ?.company_details?.industry || contact.industry;
                          if (!industryText || industryText === "-") return "-";

                          const industries = industryText
                            .split(/,(?![^(]*\))/)
                            .map((s: string) => s.trim())
                            .filter((s: string) => s);

                          return industries.map((ind: string, idx: number) => (
                            <span key={idx}>
                              <span
                                onClick={() => {
                                  dispatch(
                                    setPendingFilters({ industry: ind })
                                  );
                                  router.push("/contacts");
                                }}
                                className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer"
                              >
                                {ind}
                              </span>
                              {idx < industries.length - 1 && (
                                <span className="text-gray-900 mr-1">,</span>
                              )}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Employee Size */}
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      <Users className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">
                        Employee Size
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {contact?.linkedInData?.extractedProfileData
                          ?.company_details?.company_size || "-"}
                      </div>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">
                        Revenue
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatRevenue(
                          contact?.linkedInData?.extractedProfileData
                            ?.company_details?.annual_revenue_range || "-"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      {/* <DollarSign className="w-4 h-4 text-gray-500" /> */}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">
                        Business Model
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {contact?.linkedInData?.extractedProfileData
                          ?.company_details?.business_model || "-"}
                      </div>
                    </div>
                  </div>

                  {/* Address/Location */}
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      <MapPin className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">
                        Address/Location
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {contact.linkedInData?.extractedProfileData
                          ?.company_details?.address || "-"}
                      </div>
                    </div>
                  </div>

                  {/* Phone# */}
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      <Phone className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">Phone</div>
                      <div className="text-sm font-medium text-gray-900 space-y-1">
                        {contact.linkedInData?.extractedProfileData?.company_details?.contact_phone?.map(
                          (phone: any, index: number) => (
                            <div key={index}>{phone}</div>
                          )
                        ) || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      <Phone className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">
                        Company Email
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {contact.linkedInData?.extractedProfileData
                          ?.company_details?.contact_email || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      <Star className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">
                        Google Reviews
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {contact.linkedInData?.extractedProfileData?.company_details?.google_reviews?.map(
                          (review: any, index: number) => {
                            const sitename =
                              review.sitename ||
                              review.Sitename ||
                              review.site ||
                              "";
                            const rating = review.rating || review.Rating || "";
                            const formattedText =
                              sitename && rating
                                ? `${sitename} - ${rating}`
                                : Object.entries(review)
                                    .map(
                                      ([key, value]: [string, any]) =>
                                        `${key}: ${value}`
                                    )
                                    .join(", ");
                            return <div key={index}>{formattedText}</div>;
                          }
                        ) || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      <Star className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">
                        Other Trusted Reviews
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {contact.linkedInData?.extractedProfileData?.company_details?.other_trusted_reviews?.map(
                          (review: any, index: number) => {
                            const sitename =
                              review.sitename ||
                              review.Sitename ||
                              review.site ||
                              "";
                            const rating = review.rating || review.Rating || "";
                            const formattedText =
                              sitename && rating
                                ? `${sitename} - ${rating}`
                                : Object.entries(review)
                                    .map(
                                      ([key, value]: [string, any]) =>
                                        `${key}: ${value}`
                                    )
                                    .join(", ");
                            return <div key={index}>{formattedText}</div>;
                          }
                        ) || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="mt-0.5">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-0.5">
                        Last Year Revenue
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {contact.linkedInData?.extractedProfileData
                          ?.company_details?.last_year_turnover || "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    What we can sell to this company
                  </div>

                  <ul className="space-y-2 grid grid-cols-2 gap-2">
                    {contact.linkedInData?.extractedProfileData?.person_details
                      ?.personSalesStrategyReportDataMeta?.map?.length > 0 ? (
                      contact.linkedInData.extractedProfileData.company_details.companySalesStrategyReportDataMeta.map(
                        (item: any, index: number) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                            <span className="leading-snug">{item}</span>
                          </li>
                        )
                      )
                    ) : (
                      <li className="text-sm text-gray-400">-</li>
                    )}
                  </ul>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-4">
                  <h3 className="flex text-lg font-semibold text-gray-900 mb-4">
                    Metizsoft {<X />}
                    {(companyName || company || contact.companyName || contact.linkedInData?.extractedProfileData?.company_details?.company_name) as string}
                  </h3>
                  <div className="col-span-full">
                    {contact.linkedInData?.extractedProfileData?.company_details
                      ?.companySalesStrategyMailContent ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            contact.linkedInData.extractedProfileData
                              .company_details.companySalesStrategyMailContent,
                        }}
                        className="prose prose-sm max-w-none text-gray-700 
                          [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h1]:text-gray-900
                          [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mb-3 [&>h2]:mt-5 [&>h2]:text-gray-900
                          [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>h3]:mt-4 [&>h3]:text-gray-900
                          [&>p]:mb-4 [&>p]:leading-relaxed [&>p]:text-gray-700
                          [&>ul]:mb-4 [&>ul]:ml-6 [&>ul]:list-disc [&>ul]:space-y-2
                          [&>ol]:mb-4 [&>ol]:ml-6 [&>ol]:list-decimal [&>ol]:space-y-2
                          [&>li]:mb-1 [&>li]:leading-relaxed
                          [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4 [&>blockquote]:text-gray-600
                          [&>strong]:font-semibold [&>strong]:text-gray-900
                          [&>em]:italic
                          [&>a]:text-blue-600 [&>a]:hover:text-blue-800 [&>a]:underline
                          space-y-4"
                      />
                    ) : (
                      <p className="text-gray-500 italic">-</p>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    About the Company
                  </h3>
                  <div className="col-span-full">
                    {formatRecordInfo(
                      contact.linkedInData?.extractedProfileData
                        ?.company_details?.about
                    ) || "-"}
                  </div>
                </div>
              </div>
            </div>
          {/* )} */}

          {/* Additional Notes Section */}
          {contact.amfNotes && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-yellow-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    aMF Notes
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Additional information and remarks
                  </p>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-gray-800">{contact.amfNotes}</p>
              </div>
            </div>
          )}

          {/* Record Information Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Record Information
            </h3>
            <div className="col-span-full">
              {formatRecordInfo(
                contact.linkedInData?.extractedProfileData?.summery
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update the contact information below.
            </DialogDescription>
          </DialogHeader>
          {renderEditFormFields()}
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateContact}
              style={{
                backgroundColor:
                  user.role === "superadmin" ? "#2563EB" : "#EB432F",
              }}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
