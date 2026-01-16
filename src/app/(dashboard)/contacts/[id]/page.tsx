"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ViewContactDetails } from "@/components/ViewContactDetails";
import ContactChatBot from "@/components/ContactChatBot";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { getContacts } from "@/store/slices/contacts.slice";
import { privateApiCall, privateApiDelete } from "@/lib/api";
import type { Contact, Company, User } from "@/types/dashboard.types";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params?.id as string;

  const { user } = useAppSelector((state) => state.auth);
  const { contacts: reduxContacts } = useAppSelector((state) => state.contacts);
  const dispatch = useAppDispatch();
  const [contact, setContact] = useState(null as Contact | null);
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  const dashboardUser: User | null = user ? {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
    role: user.role || null,
  } : null;

  useEffect(() => {
    const fetchContact = async () => {
      if (!contactId) {
        setError("Contact ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // First, check if contact is already in Redux store
        let contactData: any = reduxContacts.find((c: Contact) => {
          const cId = (c as any)._id?.toString() || c.id?.toString();
          return cId === contactId;
        });

        // If not found in Redux, fetch from API with pagination
        if (!contactData) {
          let found = false;
          let page = 1;
          const limit = 100; // API max limit

          while (!found && page <= 100) { // Safety limit of 100 pages
            const response = await privateApiCall<{ contacts: any[], pagination: any }>(`/admin/contacts?page=${page}&limit=${limit}`);

            // Find the contact by ID (handle both _id and id formats)
            contactData = response.contacts.find((c: any) => {
              const cId = c._id?.toString() || c.id?.toString();
              return cId === contactId;
            });

            if (contactData) {
              found = true;
              break;
            }

            // If no more pages, stop searching
            if (page >= response.pagination.totalPages) {
              break;
            }

            page++;
          }
        }

        if (!contactData) {
          setError('Contact not found');
          toast.error('Contact not found');
          setIsLoading(false);
          return;
        }

        // Map the API response to Contact type
        // Handle contactLinkedIn field from database (contactLinkedIn) and legacy fields (LinkedInUrl, contactLinkedIn)
        const linkedInValue = (contactData as any).contactLinkedIn ||
          (contactData as any).LinkedInUrl ||
          contactData.contactLinkedIn || '';

        const mappedContact: Contact = {
          id: contactData._id?.toString() || contactData.id,
          firstName: contactData.firstName || '',
          lastName: contactData.lastName || '',
          jobTitle: contactData.jobTitle || '',
          jobLevel: contactData.jobLevel || '',
          jobRole: contactData.jobRole || '',
          email: contactData.email || '',
          phone: contactData.phone || '',
          mobilePhone: contactData.mobilePhone || '',
          directPhone: contactData.directPhone || '',
          address1: contactData.address1 || '',
          address2: contactData.address2 || '',
          city: contactData.city || '',
          state: contactData.state || '',
          zipCode: contactData.zipCode || '',
          country: contactData.country || '',
          website: contactData.website || '',
          industry: contactData.industry || '',
          contactLinkedIn: contactData.contactLinkedIn || (contactData as any).contactLinkedIn || (contactData as any).LinkedInUrl || '',
          amfNotes: contactData.amfNotes || '',
          lastUpdateDate: contactData.lastUpdateDate || (contactData as any).updatedAt || '',
          addedBy: contactData.addedBy || undefined,
          addedByRole: contactData.addedByRole || undefined,
          createdBy: contactData.createdBy || contactData.addedBy || undefined,
          addedDate: contactData.addedDate || (contactData as any).createdAt || '',
          updatedDate: contactData.updatedDate || (contactData as any).updatedAt || '',
          companyName: contactData.companyName || '',
          employeeSize: contactData.employeeSize || '',
          revenue: contactData.revenue || '',
          companyId: contactData.companyId || (contactData as any)?._companyId || (contactData as any)?.company?._id?.toString() || (contactData as any)?.company?.id || undefined,
          isEmailVerified: contactData.isEmailVerified,
          linkedInData: contactData.linkedInData || null,
          syncDate: contactData.syncDate || '',
        };

        setContact(mappedContact);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch contact';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [contactId, reduxContacts]);

  const handleBack = () => {
    router.push('/contacts');
  };

  const handleEdit = (contact: Contact) => {
    // This is now handled by ViewContactDetails component's edit modal
    // Keeping for backward compatibility but not used
  };

  const handleContactUpdated = async () => {
    // Refresh contact data after update
    if (!contactId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch updated contact from API
      let contactData: any = null;
      let page = 1;
      const limit = 100;

      while (!contactData && page <= 100) {
        const response = await privateApiCall<{ contacts: any[], pagination: any }>(`/admin/contacts?page=${page}&limit=${limit}`);

        contactData = response.contacts.find((c: any) => {
          const cId = c._id?.toString() || c.id?.toString();
          return cId === contactId;
        });

        if (contactData) break;
        if (page >= response.pagination.totalPages) break;
        page++;
      }

      if (contactData) {
        const mappedContact: Contact = {
          id: contactData._id?.toString() || contactData.id,
          firstName: contactData.firstName || '',
          lastName: contactData.lastName || '',
          jobTitle: contactData.jobTitle || '',
          jobLevel: contactData.jobLevel || '',
          jobRole: contactData.jobRole || '',
          email: contactData.email || '',
          phone: contactData.phone || '',
          mobilePhone: contactData.mobilePhone || '',
          directPhone: contactData.directPhone || '',
          address1: contactData.address1 || '',
          address2: contactData.address2 || '',
          city: contactData.city || '',
          state: contactData.state || '',
          zipCode: contactData.zipCode || '',
          country: contactData.country || '',
          website: contactData.website || '',
          industry: contactData.industry || '',
          contactLinkedIn: contactData.contactLinkedIn || (contactData as any).contactLinkedIn || (contactData as any).LinkedInUrl || '',
          amfNotes: contactData.amfNotes || '',
          lastUpdateDate: contactData.lastUpdateDate || (contactData as any).updatedAt || '',
          addedBy: contactData.addedBy || undefined,
          addedByRole: contactData.addedByRole || undefined,
          createdBy: contactData.createdBy || contactData.addedBy || undefined,
          addedDate: contactData.addedDate || (contactData as any).createdAt || '',
          updatedDate: contactData.updatedDate || (contactData as any).updatedAt || '',
          companyName: contactData.companyName || '',
          employeeSize: contactData.employeeSize || '',
          revenue: contactData.revenue || '',
          companyId: contactData.companyId || (contactData as any)?._companyId || (contactData as any)?.company?._id?.toString() || (contactData as any)?.company?.id || undefined,
          isEmailVerified: contactData.isEmailVerified,
          linkedInData: contactData.linkedInData || null,
          syncDate: contactData.syncDate || '',
        };
        setContact(mappedContact);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to refresh contact';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/admin/contacts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [contactId] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete contact');
      }

      toast.success('Contact deleted successfully');
      router.push('/contacts');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete contact';
      toast.error(errorMessage);
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

  const handleExport = (contact: Contact) => {
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
      escapeCSV(contact.contactLinkedIn || contactData.contactLinkedIn || (contactData as any).contactLinkedIn || (contactData as any).LinkedInUrl || ''),
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
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-${contact.firstName}-${contact.lastName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  if (error || !contact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Contact not found'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ViewContactDetails
        contact={contact}
        user={dashboardUser}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={handleExport}
        companyName={contact.companyName}
        company={company}
        onContactUpdated={handleContactUpdated}
      />
      <ContactChatBot
        key={contact.id}
        contactId={contact.id}
        contactName={contact.firstName + ' ' + contact.lastName}
        userId={dashboardUser.id}
        userName={dashboardUser.name}
        userEmail={dashboardUser.email}
      />
    </>
  );
}

