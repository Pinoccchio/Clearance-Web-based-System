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

const departmentNavSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/department", icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: "Clearance",
    items: [
      { label: "Clearance Queue", href: "/department/clearance", icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Requirements", href: "/department/requirements", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "History", href: "/department/history", icon: <History className="w-5 h-5" /> },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Students", href: "/department/students", icon: <Users className="w-5 h-5" /> },
      { label: "Courses", href: "/department/courses", icon: <GraduationCap className="w-5 h-5" /> },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Announcements", href: "/department/announcements", icon: <Megaphone className="w-5 h-5" /> },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/department/profile", icon: <User className="w-5 h-5" /> },
    ],
  },
];

const officeNavSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/office", icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: "Clearance",
    items: [
      { label: "Clearance Queue", href: "/office/clearance", icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Requirements", href: "/office/requirements", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "History", href: "/office/history", icon: <History className="w-5 h-5" /> },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Announcements", href: "/office/announcements", icon: <Megaphone className="w-5 h-5" /> },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/office/profile", icon: <User className="w-5 h-5" /> },
    ],
  },
];

const clubNavSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/club", icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: "Clearance",
    items: [
      { label: "Clearance Queue", href: "/club/clearance", icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Requirements", href: "/club/requirements", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "History", href: "/club/history", icon: <History className="w-5 h-5" /> },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Members", href: "/club/members", icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Announcements", href: "/club/announcements", icon: <Megaphone className="w-5 h-5" /> },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/club/profile", icon: <User className="w-5 h-5" /> },
    ],
  },
];

const studentNavSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: "Department",
    items: [
      { label: "Clearance Status", href: "/student/department/clearance",   icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Requirements",     href: "/student/department/requirements", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "Submit Clearance", href: "/student/department/submit",       icon: <Upload className="w-5 h-5" /> },
    ],
  },
  {
    title: "Offices",
    items: [
      { label: "Clearance Status", href: "/student/offices/clearance",   icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Requirements",     href: "/student/offices/requirements", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "Submit Clearance", href: "/student/offices/submit",       icon: <Upload className="w-5 h-5" /> },
    ],
  },
  {
    title: "Clubs",
    items: [
      { label: "Clearance Status", href: "/student/clubs/clearance",   icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Requirements",     href: "/student/clubs/requirements", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "Submit Clearance", href: "/student/clubs/submit",       icon: <Upload className="w-5 h-5" /> },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Announcements", href: "/student/announcements", icon: <Megaphone className="w-5 h-5" /> },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/student/profile", icon: <User className="w-5 h-5" /> },
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
  orgLogo?: string | null;
  orgName?: string | null;
}

export default function Sidebar({ role, userName, userEmail, isCollapsed, onToggleCollapse, onLogout, orgLogo, orgName }: SidebarProps) {
  const pathname = usePathname();

  const navSections =
    role === "admin" ? adminNavSections :
    role === "department" ? departmentNavSections :
    role === "office" ? officeNavSections :
    role === "club" ? clubNavSections :
    role === "student" ? studentNavSections :
    getDashboardOnlyNav(role);

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
              src={
                (role === "office" || role === "department" || role === "club")
                  ? (orgLogo || "/images/logos/cjc-logo.jpeg")
                  : "/images/logos/ccis-logo.jpg"
              }
              alt={orgName || "CJC Logo"}
              width={40}
              height={40}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-white font-semibold">CJC Clearance</p>
              <p className="text-white/50 text-xs truncate max-w-[140px]">
                {(role === "office" || role === "department" || role === "club") && orgName
                  ? orgName
                  : "CCIS Portal"}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Role Badge */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          <div className="px-3 py-1.5 bg-ccis-blue-primary/10 border border-ccis-blue-primary/20 rounded-lg">
            <p className="text-ccis-blue-light text-xs font-medium text-center">
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
                    <span className={cn("flex-shrink-0", isActive && "text-white")}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 bg-ccis-blue-light text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-ccis-blue-light text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}


      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5",
          isCollapsed && "justify-center"
        )}>
          <div className="w-9 h-9 rounded-xl bg-ccis-blue-primary/20 flex items-center justify-center text-ccis-blue-light text-sm font-semibold flex-shrink-0">
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
