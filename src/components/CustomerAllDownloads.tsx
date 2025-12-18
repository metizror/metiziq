import React, { useState } from 'react';
import { Download, Calendar, FileText, Search, Trash2, Filter, ArrowLeft, SortAsc, SortDesc, X } from 'lucide-react';

interface CustomerAllDownloadsProps {
  onBack: () => void;
}

export default function CustomerAllDownloads({ onBack }: CustomerAllDownloadsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date' as 'date' | 'size' | 'contacts');
  const [sortOrder, setSortOrder] = useState('desc' as 'asc' | 'desc');
  const [filterType, setFilterType] = useState('all' as 'all' | 'csv' | 'xlsx');
  const [selectedItems, setSelectedItems] = useState([] as number[]);

  // Extended mock downloads data
  const allDownloads = [
    { id: 1, fileName: 'Tech_Industry_Contacts_Oct_2025.csv', date: '2025-10-10', contacts: 50, size: 2.4, type: 'csv', status: 'Completed' },
    { id: 2, fileName: 'Finance_VP_Contacts_Oct_2025.xlsx', date: '2025-10-08', contacts: 100, size: 4.8, type: 'xlsx', status: 'Completed' },
    { id: 3, fileName: 'Marketing_Directors_Sep_2025.csv', date: '2025-09-28', contacts: 75, size: 3.2, type: 'csv', status: 'Completed' },
    { id: 4, fileName: 'Sales_Leaders_Sep_2025.xlsx', date: '2025-09-15', contacts: 120, size: 5.6, type: 'xlsx', status: 'Completed' },
    { id: 5, fileName: 'HR_Executives_Sep_2025.csv', date: '2025-09-10', contacts: 60, size: 2.8, type: 'csv', status: 'Completed' },
    { id: 6, fileName: 'Technology_CTOs_Aug_2025.xlsx', date: '2025-08-25', contacts: 90, size: 4.2, type: 'xlsx', status: 'Completed' },
    { id: 7, fileName: 'Healthcare_Executives_Aug_2025.csv', date: '2025-08-20', contacts: 85, size: 3.8, type: 'csv', status: 'Completed' },
    { id: 8, fileName: 'Retail_Managers_Aug_2025.xlsx', date: '2025-08-15', contacts: 110, size: 5.2, type: 'xlsx', status: 'Completed' },
    { id: 9, fileName: 'Finance_Directors_Jul_2025.csv', date: '2025-07-30', contacts: 95, size: 4.1, type: 'csv', status: 'Completed' },
    { id: 10, fileName: 'Marketing_VPs_Jul_2025.xlsx', date: '2025-07-25', contacts: 70, size: 3.5, type: 'xlsx', status: 'Completed' },
    { id: 11, fileName: 'Engineering_Leaders_Jul_2025.csv', date: '2025-07-20', contacts: 80, size: 3.6, type: 'csv', status: 'Completed' },
    { id: 12, fileName: 'Operations_Heads_Jul_2025.xlsx', date: '2025-07-15', contacts: 65, size: 3.1, type: 'xlsx', status: 'Completed' },
    { id: 13, fileName: 'Product_Managers_Jun_2025.csv', date: '2025-06-28', contacts: 55, size: 2.5, type: 'csv', status: 'Completed' },
    { id: 14, fileName: 'Sales_Directors_Jun_2025.xlsx', date: '2025-06-20', contacts: 105, size: 4.9, type: 'xlsx', status: 'Completed' },
    { id: 15, fileName: 'IT_Managers_Jun_2025.csv', date: '2025-06-15', contacts: 75, size: 3.3, type: 'csv', status: 'Completed' },
  ];

  // Filter and sort
  let filteredDownloads = allDownloads.filter(download => {
    const matchesSearch = download.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || download.type === filterType;
    return matchesSearch && matchesType;
  });

  filteredDownloads = filteredDownloads.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === 'size') {
      comparison = a.size - b.size;
    } else if (sortBy === 'contacts') {
      comparison = a.contacts - b.contacts;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev: number[]) =>
      prev.includes(id) ? prev.filter((item: number) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredDownloads.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredDownloads.map(d => d.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedItems.length} file(s)?`);
      if (confirmDelete) {
        setSelectedItems([]);
        alert('Files deleted successfully!');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalSize = filteredDownloads.reduce((sum, d) => sum + d.size, 0);
  const totalContacts = filteredDownloads.reduce((sum, d) => sum + d.contacts, 0);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-[#030000]">All Downloads</h1>
              <p className="text-gray-600 mt-1">Complete history of all downloaded files</p>
            </div>
          </div>
          {selectedItems.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete Selected ({selectedItems.length})
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e: { target: { value: string } }) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF8037] focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl">
            <Filter size={18} className="text-gray-600" />
            <select
              value={filterType}
              onChange={(e: { target: { value: string } }) => setFilterType(e.target.value as any)}
              className="bg-transparent border-none focus:outline-none text-gray-700"
            >
              <option value="all">All Types</option>
              <option value="csv">CSV Only</option>
              <option value="xlsx">Excel Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl">
            <span className="text-gray-600 text-sm">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e: { target: { value: string } }) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none focus:outline-none text-gray-700"
            >
              <option value="date">Date</option>
              <option value="size">Size</option>
              <option value="contacts">Contacts</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Files</p>
                <p className="text-[#030000] text-2xl">{filteredDownloads.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Download className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Contacts</p>
                <p className="text-[#030000] text-2xl">{totalContacts.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Size</p>
                <p className="text-[#030000] text-2xl">{totalSize.toFixed(1)} MB</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Selected</p>
                <p className="text-[#030000] text-2xl">{selectedItems.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Downloads Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredDownloads.length && filteredDownloads.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-[#EF8037] rounded focus:ring-[#EF8037]"
                    />
                  </th>
                  <th className="text-left px-6 py-4 text-gray-700">File Name</th>
                  <th className="text-left px-6 py-4 text-gray-700">Date</th>
                  <th className="text-left px-6 py-4 text-gray-700">Type</th>
                  <th className="text-left px-6 py-4 text-gray-700">Contacts</th>
                  <th className="text-left px-6 py-4 text-gray-700">Size</th>
                  <th className="text-left px-6 py-4 text-gray-700">Status</th>
                  <th className="text-left px-6 py-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDownloads.map((download, index) => (
                  <tr
                    key={download.id}
                    className={`border-b border-gray-100 hover:bg-orange-50 transition-all ${
                      selectedItems.includes(download.id) ? 'bg-orange-50' : ''
                    }`}
                    style={{
                      animation: `slideInRow 0.3s ease-out ${index * 0.03}s both`
                    }}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(download.id)}
                        onChange={() => toggleSelectItem(download.id)}
                        className="w-4 h-4 text-[#EF8037] rounded focus:ring-[#EF8037]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#EF8037]/10 to-[#EB432F]/10 flex items-center justify-center">
                          <FileText className="text-[#EF8037]" size={18} />
                        </div>
                        <span className="text-[#030000]">{download.fileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(download.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs uppercase ${
                        download.type === 'csv'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {download.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{download.contacts}</td>
                    <td className="px-6 py-4 text-gray-600">{download.size} MB</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {download.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 bg-gradient-to-r from-[#EF8037] to-[#EB432F] text-white rounded-lg hover:shadow-lg transition-all">
                          <Download size={16} />
                        </button>
                        <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredDownloads.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-gray-400" size={48} />
            </div>
            <h3 className="text-[#030000] mb-2">No downloads found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-200 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="relative flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-xl">
              <FileText className="text-white" size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-[#030000] mb-2">📦 Storage & Management</h3>
              <p className="text-gray-700 mb-3 leading-relaxed">
                All files are securely stored for <span className="text-blue-600 px-2 py-0.5 bg-blue-100 rounded">90 days</span>. You can re-download any file at no extra cost during this period.
              </p>
              <p className="text-gray-700">
                Use the search and filter options above to quickly find specific downloads. Select multiple files to delete them in bulk.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRow {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
