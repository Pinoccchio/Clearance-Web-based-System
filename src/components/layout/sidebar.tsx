"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CheckSquare,
  BarChart3,
  Building2,
  Shield,
  History,
  FolderOpen,
  Bell,
  Settings,
  Upload,
  Megaphone,
  PauseCircle,
  User,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Full navigation for admin
const adminNavSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: "Users", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    title: "Clearance Sources",
    items: [
      { label: "Departments", href: "/admin/departments", icon: <GraduationCap className="w-5 h-5" /> },
      { label: "Offices", href: "/admin/offices", icon: <Building2 className="w-5 h-5" /> },
      { label: "Clubs", href: "/admin/clubs", icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Announcements", href: "/admin/announcements", icon: <Megaphone className="w-5 h-5" /> },
      { label: "Settings", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
    ],
  },
];

// Dashboard-only navigation for other roles (placeholder)
const getDashboardOnlyNav = (role: UserRole): NavSection[] => [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: `/${role}`, icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
];

const roleLabels: Record<UserRole, string> = {
  student: "Student",
  office: "Office Staff",
  department: "Department",
  club: "Club Officer",
  admin: "Administrator",
};

interface SidebarProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout?: () => void;
}

export default function Sidebar({ role, userName, userEmail, isCollapsed, onToggleCollapse, onLogout }: SidebarProps) {
  const pathname = usePathname();

  // Only admin gets full navigation, other roles get dashboard only
  const navSections = role === "admin" ? adminNavSections : getDashboardOnlyNav(role);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-cjc-navy to-cjc-navy-light transition-all duration-200 flex flex-col",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-white/10">
        <Link href={`/${role}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 p-0.5">
            <Image
              src="/images/logos/cjc-logo.jpg"
              alt="CJC Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-white font-semibold">CJC Clearance</p>
              <p className="text-white/50 text-xs">CCIS Portal</p>
            </div>
          )}
        </Link>
      </div>

      {/* Role Badge */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          <div className="px-3 py-1.5 bg-cjc-gold/10 border border-cjc-gold/20 rounded-lg">
            <p className="text-cjc-gold text-xs font-medium text-center">
              {roleLabels[role]}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navSections.map((section, sectionIndex) => (
          <div key={section.title} className={cn(sectionIndex > 0 && "mt-6")}>
            {!isCollapsed && (
              <p className="sidebar-section-label">{section.title}</p>
            )}
            {isCollapsed && sectionIndex > 0 && (
              <div className="h-px bg-white/10 my-3 mx-2" />
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== `/${role}` && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "sidebar-nav-item group relative",
                      isActive && "active"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={cn("flex-shrink-0", isActive && "text-cjc-gold")}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 bg-cjc-gold text-cjc-navy text-xs font-bold rounded-full flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-cjc-gold text-cjc-navy text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Coming Soon message for non-admin roles */}
        {role !== "admin" && !isCollapsed && (
          <div className="mt-6 px-3 py-4 bg-white/5 rounded-xl">
            <p className="text-white/60 text-xs text-center">
              More features coming soon
            </p>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5",
          isCollapsed && "justify-center"
        )}>
          <div className="w-9 h-9 rounded-xl bg-cjc-gold/20 flex items-center justify-center text-cjc-gold text-sm font-semibold flex-shrink-0">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{userName}</p>
              <p className="text-white/50 text-xs truncate">{userEmail}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="sidebar-nav-item hover:bg-red-500/10 hover:text-red-400 w-full"
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-cjc-navy-light border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-cjc-navy transition-colors shadow-lg"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
}
