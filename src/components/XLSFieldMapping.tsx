import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface XLSFieldMappingProps {
  onMappingComplete: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

// System fields from Excel specification (25 fields total)
const SYSTEM_FIELDS = [
  // Contact Fields (10)
  { id: 'salutation', label: 'Salutation', required: false, category: 'Contact' },
  { id: 'firstName', label: 'First Name', required: true, category: 'Contact' },
  { id: 'lastName', label: 'Last Name', required: true, category: 'Contact' },
  { id: 'jobTitle', label: 'Job_Title', required: false, category: 'Contact' },
  { id: 'jobLevel', label: 'Job Level', required: false, category: 'Contact' },
  { id: 'jobRole', label: 'Job Role/Department', required: false, category: 'Contact' },
  { id: 'email', label: 'Email', required: true, category: 'Contact' },
  { id: 'phone', label: 'Phone', required: false, category: 'Contact' },
  { id: 'directPhone', label: 'Direct Phone / Ext.', required: false, category: 'Contact' },
  { id: 'contactLinkedIn', label: 'Contact_LinkedIn URL', required: false, category: 'Contact' },
  
  // Company Fields (13)
  { id: 'companyName', label: 'Company Name', required: true, category: 'Company' },
  { id: 'address', label: 'Address', required: false, category: 'Company' },
  { id: 'address2', label: 'Address 2', required: false, category: 'Company' },
  { id: 'city', label: 'City', required: false, category: 'Company' },
  { id: 'state', label: 'State', required: false, category: 'Company' },
  { id: 'zipCode', label: 'Zip Code', required: false, category: 'Company' },
  { id: 'country', label: 'Country', required: false, category: 'Company' },
  { id: 'website', label: 'Website', required: false, category: 'Company' },
  { id: 'revenue', label: 'Revenue', required: false, category: 'Company' },
  { id: 'employeeSize', label: 'Employee Size', required: false, category: 'Company' },
  { id: 'industry', label: 'Industry', required: false, category: 'Company' },
  { id: 'companyLinkedIn', label: 'Company_LinkedIn URL', required: false, category: 'Company' },
  { id: 'technology', label: 'Technology-Installed Base', required: false, category: 'Company' },
  
  // System Fields (2)
  { id: 'amfNotes', label: 'aMF Notes', required: false, category: 'System' },
  { id: 'lastUpdateDate', label: 'Last Update Date', required: false, category: 'System' },
];

export function XLSFieldMapping({ onMappingComplete, onCancel }: XLSFieldMappingProps) {
  const [file, setFile] = useState(null as File | null);
  const [xlsColumns, setXlsColumns] = useState([] as string[]);
  const [mapping, setMapping] = useState({} as Record<string, string>);

  const handleFileUpload = (event: any) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    // Only accept .xls files
    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xls' && fileExtension !== 'xlsx') {
      toast.error('Please upload only XLS files (.xls or .xlsx)');
      return;
    }

    setFile(uploadedFile);
    
    // Mock XLS column extraction (in real app, use a library like xlsx)
    // Simulating extracted column headers from XLS file - matching typical Excel export
    const mockXlsColumns = [
      'Salutation',
      'First Name',
      'Last Name',
      'Job_Title',
      'Job Level',
      'Job Role/Department',
      'Email',
      'Phone',
      'Direct Phone / Ext.',
      'Contact_LinkedIn URL',
      'Company Name',
      'Address',
      'Address 2',
      'City',
      'State',
      'Zip Code',
      'Country',
      'Website',
      'Revenue',
      'Employee Size',
      'Industry',
      'Company_LinkedIn URL',
      'Technology-Installed Base',
      'aMF Notes',
      'Last Update Date'
    ];
    
    setXlsColumns(mockXlsColumns);
    toast.success('XLS file uploaded successfully! Please map the fields.');
  };

  const handleMapField = (systemFieldId: string, xlsColumn: string) => {
    setMapping((prev: Record<string, string>) => {
      const newMapping = { ...prev };
      
      // If selecting 'skip', remove the mapping
      if (xlsColumn === 'skip') {
        delete newMapping[systemFieldId];
        return newMapping;
      }
      
      // Remove any previous mapping of this XLS column to other fields
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === xlsColumn) {
          delete newMapping[key];
        }
      });
      
      newMapping[systemFieldId] = xlsColumn;
      return newMapping;
    });
  };

  const handleMapFields = () => {
    // Check if all required fields are mapped
    const requiredFields = SYSTEM_FIELDS.filter(f => f.required);
    const unmappedRequired = requiredFields.filter(f => !mapping[f.id]);
    
    if (unmappedRequired.length > 0) {
      toast.error(`Please map all required fields: ${unmappedRequired.map(f => f.label).join(', ')}`);
      return;
    }

    toast.success('Field mapping completed successfully!');
    onMappingComplete(mapping);
  };

  const isXlsColumnMapped = (column: string) => {
    return Object.values(mapping).includes(column);
  };

  if (!file) {
    return (
      <Card className="relative overflow-hidden border-0 bg-white shadow-xl">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-32 h-32 bg-gradient-to-tr from-orange-400/5 to-orange-600/5 rounded-full blur-2xl" />
        
        {/* Top Gradient Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500" />
        
        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                <Upload className="w-8 h-8 text-white" strokeWidth={2.5} />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 opacity-50 blur-lg" />
              </div>
              
              <div>
                <CardTitle className="text-2xl">Import Data</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Upload CSV or Excel files to import contacts and companies</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 animate-pulse" />
              <span className="text-xs font-medium text-orange-700">Owner Only</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileSpreadsheet className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Upload XLS File</h3>
            <p className="text-gray-600 mb-6">Select an Excel file (.xls or .xlsx) to begin field mapping</p>
            
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
              id="xls-upload"
            />
            <label htmlFor="xls-upload">
              <Button asChild className="cursor-pointer" style={{ backgroundColor: '#EF8037' }}>
                <span>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Choose XLS File
                </span>
              </Button>
            </label>

            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 bg-white shadow-xl max-w-6xl mx-auto">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full blur-3xl" />
      
      {/* Top Gradient Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500" />
      
      <CardHeader className="relative pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
              <Upload className="w-8 h-8 text-white" strokeWidth={2.5} />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 opacity-50 blur-lg" />
            </div>
            
            <div>
              <CardTitle className="text-2xl">Import Data</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Upload CSV or Excel files to import contacts and companies</p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={() => {
            setFile(null);
            setXlsColumns([]);
            setMapping({});
          }}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200">
          <p className="text-sm text-gray-700">
            <span className="font-medium">File:</span> {file.name}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="relative px-6 pb-6">
        {/* Map Columns Section */}
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-900 mb-1.5">Map Columns</h2>
          <p className="text-sm text-gray-600">Map your XLS columns to the appropriate system fields</p>
        </div>

        {/* Mapping List */}
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-2 mb-6">
          {SYSTEM_FIELDS.map(field => {
            const mappedColumn = mapping[field.id];
            
            return (
              <div key={field.id} className="flex items-center gap-3">
                {/* System Field Name (Left) */}
                <div className="flex-shrink-0 w-64 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {field.label}
                    {field.required && <span className="text-red-600 ml-1">*</span>}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>

                {/* XLS Column Dropdown (Right) */}
                <div className="flex-1 min-w-0">
                  <Select
                    value={mapping[field.id] || 'skip'}
                    onValueChange={(value: string) => handleMapField(field.id, value)}
                  >
                    <SelectTrigger className="w-full bg-white h-10">
                      <SelectValue placeholder="Skip this column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip this column</SelectItem>
                      {xlsColumns.map((column: string) => (
                        <SelectItem 
                          key={column} 
                          value={column}
                          disabled={isXlsColumnMapped(column) && mapping[field.id] !== column}
                        >
                          {column}
                          {isXlsColumnMapped(column) && mapping[field.id] !== column && ' (Already mapped)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Check Icon */}
                <div className="flex-shrink-0 w-5">
                  {mappedColumn && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Alert */}
        <div className="mb-5">
          <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1.5">Mapping Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Fields marked with <span className="text-red-600">*</span> are required and must be mapped</li>
                <li>Select "Skip this column" if you don't want to import data for that field</li>
                <li>Each XLS column can only be mapped to one system field</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">
                Mapped: <span className="font-medium text-gray-900">
                  {Object.values(mapping).filter(v => v).length} / {SYSTEM_FIELDS.length}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-gray-600">
                Required: <span className="font-medium text-gray-900">
                  {SYSTEM_FIELDS.filter(f => f.required && mapping[f.id]).length} / {SYSTEM_FIELDS.filter(f => f.required).length}
                </span>
              </span>
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleMapFields} style={{ backgroundColor: '#EF8037' }} className="flex-1 sm:flex-none">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Mapping
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
