import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  User, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Globe, 
  Linkedin, 
  DollarSign, 
  Users,
  BarChart,
  Cpu
} from 'lucide-react';
import type { Contact, Company } from '@/types/dashboard.types';

interface ContactsListViewProps {
  contacts: Contact[];
  companies: Company[];
  onViewContact?: (contact: Contact) => void;
}

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

export function ContactsListView({ contacts, companies, onViewContact }: ContactsListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedContact, setExpandedContact] = useState(null as string | null);

  // Helper function to get company data by contact's companyId
  const getCompanyData = (contact: Contact) => {
    if (!contact.companyId) return null;
    return companies.find(c => c.id === contact.companyId);
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    const company = getCompanyData(contact);
    return (
      contact.firstName.toLowerCase().includes(searchLower) ||
      contact.lastName.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.jobTitle.toLowerCase().includes(searchLower) ||
      company?.companyName.toLowerCase().includes(searchLower) ||
      ''
    );
  });

  const InfoField = ({ 
    icon: Icon, 
    label, 
    value 
  }: { 
    icon: any; 
    label: string; 
    value: string | undefined;
  }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-0.5">{label}</div>
          <div className="text-sm text-gray-900 break-words">{value}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">All Contacts</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search contacts by name, email, job title, or company..."
            value={searchQuery}
            onChange={(e: { target: { value: string } }) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        {filteredContacts.map((contact) => {
          const company = getCompanyData(contact);
          const isExpanded = expandedContact === contact.id;

          return (
            <Card key={contact.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Contact Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                      {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{contact.jobTitle || 'No Title'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {contact.jobLevel && (
                      <Badge variant="secondary">{contact.jobLevel}</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedContact(isExpanded ? null : contact.id)}
                    >
                      {isExpanded ? (
                        <>
                          Hide Details <ChevronUp className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        <>
                          View Details <ChevronDown className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-6 pt-4 border-t border-gray-200">
                    {/* Contact Information Section */}
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg hover:from-blue-100 hover:to-cyan-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-900">Contact Information</h4>
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                          <InfoField
                            icon={User}
                            label="Contact Name"
                            value={`${contact.firstName} ${contact.lastName}`}
                          />
                          <InfoField
                            icon={Briefcase}
                            label="Job Title"
                            value={contact.jobTitle}
                          />
                          <InfoField
                            icon={BarChart}
                            label="Job Level"
                            value={contact.jobLevel}
                          />
                          <InfoField
                            icon={Briefcase}
                            label="Role/Department"
                            value={contact.jobRole}
                          />
                          <InfoField
                            icon={Mail}
                            label="Email Id"
                            value={contact.email}
                          />
                          <InfoField
                            icon={Phone}
                            label="Phone#"
                            value={contact.phone}
                          />
                          <InfoField
                            icon={Phone}
                            label="Direct / Mobile#"
                            value={contact.directPhone}
                          />
                          <InfoField
                            icon={Linkedin}
                            label="Contact_LinkedIn"
                            value={contact.contactLinkedInUrl}
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Company Information Section */}
                    {company && (
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg hover:from-orange-100 hover:to-amber-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900">Company Information</h4>
                          </div>
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <InfoField
                              icon={Building2}
                              label="Company Name"
                              value={company.companyName}
                            />
                            <InfoField
                              icon={Globe}
                              label="Website"
                              value={company.website}
                            />
                            <InfoField
                              icon={Briefcase}
                              label="Industry"
                              value={company.industry}
                            />
                            <InfoField
                              icon={Users}
                              label="Employee Size"
                              value={company.employeeSize}
                            />
                            <InfoField
                              icon={DollarSign}
                              label="Revenue"
                              value={formatRevenue(company.revenue)}
                            />
                            <InfoField
                              icon={MapPin}
                              label="Address/Location"
                              value={`${company.address1}${company.address2 ? ', ' + company.address2 : ''}${company.city ? ', ' + company.city : ''}${company.state ? ', ' + company.state : ''}`}
                            />
                            <InfoField
                              icon={Phone}
                              label="Phone#"
                              value={company.phone}
                            />
                            <InfoField
                              icon={Linkedin}
                              label="Company_LinkedIn"
                              value={company.companyLinkedInUrl}
                            />
                            <InfoField
                              icon={Cpu}
                              label="Technology-Installed Base"
                              value={company.technology}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Notes Section */}
                    {contact.amfNotes && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="text-sm font-medium text-yellow-900 mb-1">Notes:</div>
                          <div className="text-sm text-yellow-800">{contact.amfNotes}</div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                      {onViewContact && (
                        <Button
                          onClick={() => onViewContact(contact)}
                          style={{ backgroundColor: '#EF8037' }}
                        >
                          View Full Details
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredContacts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No contacts found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
