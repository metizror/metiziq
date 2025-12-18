export type UserRole = 'superadmin' | 'admin' | 'customer' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Contact {
  id: string;
  companyId?: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  jobLevel: string;
  jobRole: string;
  email: string;
  phone: string;
  directPhone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website: string;
  industry: string;
  contactLinkedInUrl: string;
  amfNotes: string;
  lastUpdateDate: string;
  addedBy?: string;
  addedByRole?: string;
  addedDate: string;
  updatedDate: string;
  createdBy?: string; // From API - who created the contact
  companyName?: string;
  employeeSize?: string;
  revenue?: string;
  contactOwner?: string;
  mobilePhone?: string;
  emailOptOut?: boolean;
  tag?: string;
  description?: string;
  modifiedBy?: string;
  createdTime?: string;
  modifiedTime?: string;
  lastActivityTime?: string;
  contactName?: string;
  unsubscribedMode?: string;
  unsubscribedTime?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingCountry?: string;
  mailingZip?: string;
}

export interface Company {
  id: string;
  companyName: string;
  phone?: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  otherCountry?: string;
  website: string;
  revenue: string;
  employeeSize: string;
  industry: string;
  otherIndustry?: string;
  subIndustry?: string;
  technology: string;
  companyLinkedInUrl?: string;
  amfNotes: string;
  lastUpdateDate: string;
  addedBy?: string;
  addedByRole?: string;
  addedDate: string;
  updatedDate: string;
  createdBy?: string; // From API - who created the company
  uploaderId?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details?: string;
  description?: string;
  user?: string;
  userName?: string;
  createdBy?: string;
  role?: string;
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface ApprovalRequest {
  id: string;
  firstName: string;
  lastName: string;
  businessEmail: string;
  companyName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  isBlocked?: boolean;
}

