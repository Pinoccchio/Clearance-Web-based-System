"use client";

import { useState } from "react";
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
  HelpCircle,
  GraduationCap,
  CheckSquare,
  BarChart3,
  Building2,
  Shield,
  History,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSectionsByRole: Record<UserRole, NavSection[]> = {
  student: [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "My Clearance", href: "/student/clearance", icon: <FileText className="w-5 h-5" /> },
        { label: "Requirements", href: "/student/requirements", icon: <ClipboardList className="w-5 h-5" /> },
      ],
    },
    {
      title: "More",
      items: [
        { label: "History", href: "/student/history", icon: <History className="w-5 h-5" /> },
      ],
    },
  ],
  department: [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/department", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Pending Reviews", href: "/department/pending", icon: <ClipboardList className="w-5 h-5" /> },
        { label: "Approved", href: "/department/approved", icon: <CheckSquare className="w-5 h-5" /> },
      ],
    },
    {
      title: "More",
      items: [
        { label: "History", href: "/department/history", icon: <History className="w-5 h-5" /> },
      ],
    },
  ],
  organization: [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/organization", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Clearances", href: "/organization/clearances", icon: <FileText className="w-5 h-5" /> },
        { label: "Members", href: "/organization/members", icon: <GraduationCap className="w-5 h-5" /> },
      ],
    },
    {
      title: "Reports",
      items: [
        { label: "Reports", href: "/organization/reports", icon: <BarChart3 className="w-5 h-5" /> },
      ],
    },
  ],
  dean: [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/dean", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Overview", href: "/dean/overview", icon: <BarChart3 className="w-5 h-5" /> },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "Students", href: "/dean/students", icon: <GraduationCap className="w-5 h-5" /> },
        { label: "Departments", href: "/dean/departments", icon: <Building2 className="w-5 h-5" /> },
      ],
    },
  ],
  admin: [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Users", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
        { label: "Departments", href: "/admin/departments", icon: <Building2 className="w-5 h-5" /> },
      ],
    },
    {
      title: "System",
      items: [
        { label: "System Logs", href: "/admin/logs", icon: <FolderOpen className="w-5 h-5" /> },
        { label: "Settings", href: "/admin/settings", icon: <Shield className="w-5 h-5" /> },
      ],
    },
  ],
};

interface SidebarProps {
  role: UserRole;
  userName: string;
  userEmail: string;
}

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navSections = navSectionsByRole[role];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-cjc-navy transition-all duration-200 flex flex-col",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-slate-800">
        <Link href={`/${role}`} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
            <Image
              src="/images/logos/cjc-logo.jpg"
              alt="CJC Logo"
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-white text-sm font-semibold">CJC Clearance</p>
              <p className="text-slate-500 text-xs">CCIS Portal</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {navSections.map((section, sectionIndex) => (
          <div key={section.title} className={cn(sectionIndex > 0 && "mt-6")}>
            {!isCollapsed && (
              <p className="sidebar-section-label">{section.title}</p>
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
                      "sidebar-nav-item",
                      isActive && "active"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={cn("flex-shrink-0", isActive && "nav-icon")}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        {/* Help */}
        <Link
          href="#"
          className="sidebar-nav-item"
          title={isCollapsed ? "Help Center" : undefined}
        >
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Help Center</span>}
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-cjc-gold/20 flex items-center justify-center text-cjc-gold text-xs font-semibold flex-shrink-0">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{userName}</p>
              <p className="text-slate-500 text-xs truncate">{userEmail}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <Link
          href="/"
          className="sidebar-nav-item hover:bg-red-500/10 hover:text-red-400"
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
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
