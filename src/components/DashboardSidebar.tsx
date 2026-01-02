import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  Upload,
  Activity,
  Settings,
  LogOut,
  Shield,
  MessageCircle,
  CheckCircle2,
  RefreshCw,
  Menu,
  X,
} from "lucide-react";
import { UserObject } from "@/types/auth.types";
import Image from "next/image";
const marketForceLogo = "https://www.metizsoft.com/wp-content/uploads/2023/09/Metiz-logo-1.svg";

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  exclusive?: boolean;
  badge?: number;
}

interface SidebarProps {
  activeView: string;
  menuItems: MenuItem[];
  user: UserObject;
  onLogout: () => void;
  onSupportClick?: () => void;
  pendingRequestsCount?: number;
  isOpen?: boolean;
  onToggle?: () => void;
}

const iconMap = {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  Upload,
  Activity,
  Settings,
  MessageCircle,
  CheckCircle2,
  RefreshCw,
};

export function DashboardSidebar({
  activeView,
  menuItems,
  user,
  onLogout,
  onSupportClick,
  pendingRequestsCount = 0,
  isOpen = true,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header with Toggle Button */}
      <div className={`p-4 border-b border-gray-200 transition-all duration-300 relative ${
        isOpen ? 'px-6' : 'px-2'
      }`}>
        {/* Close Button - Top Right (when open) */}
        {isOpen && onToggle && (
          <button
            onClick={onToggle}
            className="absolute top-2 right-2 p-2 rounded-md cursor-pointer transition-colors duration-200 z-10"
            aria-label="Collapse sidebar"
          >
            <X className="w-5 h-5 text-gray-700 transition-opacity duration-300" />
          </button>
        )}
        
        <div className={`flex items-center transition-all duration-300 ${
          isOpen ? 'justify-center' : 'justify-center'
        }`}>
          {/* Hamburger/Menu Button - Show when closed */}
          {!isOpen && onToggle && (
            <button
              onClick={onToggle}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
              aria-label="Expand sidebar"
            >
              <Menu className="w-5 h-5 text-gray-700 transition-opacity duration-300" />
            </button>
          )}
          
          {/* Logo - Only show when open */}
          {isOpen && (
            <div className="flex items-center justify-center" style={{ minHeight: '60px' }}>
              <Image
                src={marketForceLogo}
                alt="Market Force"
                width={180}
                height={60}
                priority
                style={{
                  width: 'auto',
                  height: '60px',
                  objectFit: 'contain',
                  maxWidth: '180px'
                }}
                className="transition-opacity duration-300"
              />
            </div>
          )}
        </div>

        {/* User Info - Only show when open */}
        {isOpen && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-600 mb-2">{user.email}</p>
            <Badge
              variant={user.role === "superadmin" ? "default" : "secondary"}
              className="text-xs"
            >
              {user.role === "superadmin" && <Shield className="w-3 h-3 mr-1" />}
              {user.role === "superadmin" ? "Owner" : "Admin"}
            </Badge>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className={`flex-1 p-4 space-y-2 transition-all duration-300 ${
        isOpen ? 'px-4' : 'px-2'
      }`}>
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          const isExclusive = item.exclusive && user.role !== "superadmin";

          if (isExclusive) return null;

          return (
            <Link key={item.id} href={item.path} title={!isOpen ? item.label : ''}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full h-10 relative transition-all duration-300 ${
                  isOpen 
                    ? 'justify-start' 
                    : 'justify-center px-0'
                } ${
                  isActive
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <Icon className={`${isOpen ? 'w-4 h-4 mr-3' : 'w-5 h-5'}`} />
                {isOpen && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge className="ml-auto bg-blue-600 text-white text-xs h-5 min-w-5 px-1.5 flex items-center justify-center">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Support & Logout */}
      <div className={`p-4 border-t border-gray-200 space-y-2 transition-all duration-300 ${
        isOpen ? 'px-4' : 'px-2'
      }`}>
        {onSupportClick && (
          <Button
            variant="ghost"
            className={`w-full h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 ${
              isOpen ? 'justify-start' : 'justify-center px-0'
            }`}
            onClick={onSupportClick}
            title={!isOpen ? 'Support' : ''}
          >
            <MessageCircle className={isOpen ? 'w-4 h-4 mr-3' : 'w-5 h-5'} />
            {isOpen && <span>Support</span>}
          </Button>
        )}
        <Button
          variant="ghost"
          className={`w-full h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 ${
            isOpen ? 'justify-start' : 'justify-center px-0'
          }`}
          onClick={onLogout}
          title={!isOpen ? 'Sign Out' : ''}
        >
          <LogOut className={isOpen ? 'w-4 h-4 mr-3' : 'w-5 h-5'} />
          {isOpen && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}
