import React from 'react';
import Link from 'next/link';
import { Home, Search, Download, FileText, Settings, LogOut, Menu, X, MessageCircle } from 'lucide-react';

interface CustomerSidebarProps {
  pathname: string;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onSupportClick: () => void;
  onLogout: () => void;
}

export default function CustomerSidebar({ pathname, isCollapsed, setIsCollapsed, onSupportClick, onLogout }: CustomerSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/customer/dashboard' },
    { id: 'contacts', label: 'Contact Search Filters', icon: Search, path: '/customer/contacts' },
    { id: 'companies', label: 'Company Search Filters', icon: Search, path: '/customer/companies' },
    { id: 'downloads', label: 'My Downloads', icon: Download, path: '/customer/downloads' },
    { id: 'invoices', label: 'Invoices & History', icon: FileText, path: '/customer/invoices' },
    { id: 'settings', label: 'Account Settings', icon: Settings, path: '/customer/settings' },
  ];

  return (
    <div 
      className={`h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EF8037] to-[#EB432F] flex items-center justify-center">
              <span className="text-white">C</span>
            </div>
            <span className="text-[#030000]">Customer Portal</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/customer/dashboard' && pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#EF8037] text-white shadow-lg shadow-orange-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Support & Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={onSupportClick}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all`}
        >
          <MessageCircle size={20} />
          {!isCollapsed && <span>Support</span>}
        </button>
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all`}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
