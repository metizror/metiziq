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
};

export function DashboardSidebar({
  activeView,
  menuItems,
  user,
  onLogout,
  onSupportClick,
  pendingRequestsCount = 0,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo & User Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-center mb-4 px-2" style={{ minHeight: '60px', position: 'relative' }}>
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

        <div>
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
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          const isExclusive = item.exclusive && user.role !== "superadmin";

          if (isExclusive) return null;

          return (
            <Link key={item.id} href={item.path}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start h-10 relative ${isActive
                  ? user.role === "superadmin"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-600 hover:bg-blue-700"
                  : "hover:bg-gray-100"
                  }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
                {item.badge && item.badge > 0 && (
                  <Badge className="ml-auto bg-blue-600 text-white text-xs h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {item.badge}
                  </Badge>
                )}

              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Support & Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {onSupportClick && (
          <Button
            variant="ghost"
            className="w-full justify-start h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={onSupportClick}
          >
            <MessageCircle className="w-4 h-4 mr-3" />
            Support
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
