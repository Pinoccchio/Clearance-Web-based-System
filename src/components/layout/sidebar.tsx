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
  Activity,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/supabase";
import { Avatar } from "@/components/ui/Avatar";

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
      { label: "CSG LGUs", href: "/admin/csg-lgus", icon: <Shield className="w-5 h-5" /> },
      { label: "CSPSP Divisions", href: "/admin/cspsp-divisions", icon: <GraduationCap className="w-5 h-5" /> },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Announcements", href: "/admin/announcements", icon: <Megaphone className="w-5 h-5" /> },
      { label: "Events", href: "/admin/events", icon: <Calendar className="w-5 h-5" /> },
      { label: "Logs", href: "/admin/logs", icon: <Activity className="w-5 h-5" /> },
      { label: "Settings", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
    ],
  },
];

// Dashboard-only navigation for other roles (placeholder)
const getDashboardOnlyNav = (role: UserRole): NavSection[] => {
  const rolePathMap: Record<string, string> = { csg_lgu: 'csg-lgu', cspsp_division: 'cspsp-division' };
  const path = rolePathMap[role] ?? role;
  return [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: `/${path}`, icon: <LayoutDashboard className="w-5 h-5" /> },
      ],
    },
  ];
};

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
    title: "Events",
    items: [
      { label: "Events", href: "/department/events", icon: <Calendar className="w-5 h-5" /> },
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
      { label: "Students", href: "/office/students", icon: <Users className="w-5 h-5" /> },
      { label: "Requirements", href: "/office/requirements", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "History", href: "/office/history", icon: <History className="w-5 h-5" /> },
    ],
  },
  {
    title: "Events",
    items: [
      { label: "Events", href: "/office/events", icon: <Calendar className="w-5 h-5" /> },
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
    title: "Events",
    items: [
      { label: "Events", href: "/club/events", icon: <Calendar className="w-5 h-5" /> },
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

const csgLguNavSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/csg-lgu", icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: "Clearance",
    items: [
      { label: "Clearance Queue", href: "/csg-lgu/clearance", icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Requirements", href: "/csg-lgu/requirements", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "History", href: "/csg-lgu/history", icon: <History className="w-5 h-5" /> },
    ],
  },
  {
    title: "Events",
    items: [
      { label: "Events", href: "/csg-lgu/events", icon: <Calendar className="w-5 h-5" /> },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Students", href: "/csg-lgu/students", icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Announcements", href: "/csg-lgu/announcements", icon: <Megaphone className="w-5 h-5" /> },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/csg-lgu/profile", icon: <User className="w-5 h-5" /> },
    ],
  },
];

const cspspDivisionNavSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/cspsp-division", icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: "Clearance",
    items: [
      { label: "Clearance Queue", href: "/cspsp-division/clearance", icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Requirements", href: "/cspsp-division/requirements", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "History", href: "/cspsp-division/history", icon: <History className="w-5 h-5" /> },
    ],
  },
  {
    title: "Events",
    items: [
      { label: "Events", href: "/cspsp-division/events", icon: <Calendar className="w-5 h-5" /> },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Students", href: "/cspsp-division/students", icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Announcements", href: "/cspsp-division/announcements", icon: <Megaphone className="w-5 h-5" /> },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/cspsp-division/profile", icon: <User className="w-5 h-5" /> },
    ],
  },
];

const studentNavSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: "History", href: "/student/history", icon: <History className="w-5 h-5" /> },
      { label: "Documents", href: "/student/documents", icon: <FolderOpen className="w-5 h-5" /> },
      { label: "My Events", href: "/student/events", icon: <Calendar className="w-5 h-5" /> },
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
    title: "CSG LGU",
    items: [
      { label: "Clearance Status", href: "/student/csg-lgu/clearance",   icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Requirements",     href: "/student/csg-lgu/requirements", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "Submit Clearance", href: "/student/csg-lgu/submit",       icon: <Upload className="w-5 h-5" /> },
    ],
  },
  {
    title: "CSPSP Division",
    items: [
      { label: "Clearance Status", href: "/student/cspsp-division/clearance",   icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Requirements",     href: "/student/cspsp-division/requirements", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "Submit Clearance", href: "/student/cspsp-division/submit",       icon: <Upload className="w-5 h-5" /> },
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
  csg_lgu: "CSG LGU Head",
  cspsp_division: "CSPSP Division Head",
  admin: "Administrator",
};

interface SidebarProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout?: () => void;
  orgLogo?: string | null;
  orgName?: string | null;
  isCsp?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ role, userName, userEmail, userAvatar, isCollapsed, onToggleCollapse, onLogout, orgLogo, orgName, isCsp, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const roleToPath: Record<string, string> = { csg_lgu: 'csg-lgu', cspsp_division: 'cspsp-division' };
  const effectiveRole = roleToPath[role] ?? role;

  const getStudentNav = (): NavSection[] => {
    const excludeTitle = isCsp ? "CSG LGU" : "CSPSP Division";
    return studentNavSections.filter((section) => section.title !== excludeTitle);
  };

  const navSections =
    role === "admin" ? adminNavSections :
    role === "department" ? departmentNavSections :
    role === "office" ? officeNavSections :
    role === "club" ? clubNavSections :
    role === "csg_lgu" ? csgLguNavSections :
    role === "cspsp_division" ? cspspDivisionNavSections :
    role === "student" ? getStudentNav() :
    getDashboardOnlyNav(role);

  return (
    <aside
      className={cn(
        "h-screen bg-gradient-to-b from-[#2d0a0d] to-cjc-red-dark transition-all duration-200 flex flex-col",
        // Mobile: always full width (w-64), Desktop: collapsible
        "w-64",
        isCollapsed && "lg:w-[72px]"
      )}
    >
      {/* Logo Section */}
      <div className="p-4 pt-[calc(0.75rem+env(safe-area-inset-top))] border-b border-white/10">
        <Link href={`/${effectiveRole}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 p-0.5">
            <Image
              src={
                (role === "office" || role === "department" || role === "club" || role === "csg_lgu" || role === "cspsp_division")
                  ? (orgLogo || "/images/logos/cjc-logo.jpeg")
                  : "/images/logos/cjc-logo.jpeg"
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
                {(role === "office" || role === "department" || role === "club" || role === "csg_lgu" || role === "cspsp_division") && orgName
                  ? orgName
                  : "Clearance System"}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Role Badge */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          <div className="px-3 py-1.5 bg-cjc-red/10 border border-cjc-red/20 rounded-lg">
            <p className="text-cjc-gold-light text-xs font-medium text-center">
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
                  (item.href !== `/${effectiveRole}` && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
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
                          <span className="min-w-[20px] h-5 px-1.5 bg-cjc-gold text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-cjc-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
          <Avatar
            src={userAvatar ?? undefined}
            name={userName}
            size="sm"
            variant="primary"
            className="rounded-xl flex-shrink-0 w-9 h-9 text-sm"
          />
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

      {/* Collapse Toggle — desktop only */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-cjc-red-dark border border-white/20 items-center justify-center text-white/60 hover:text-white hover:bg-cjc-red-dark transition-colors shadow-lg"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Close button — mobile only */}
      {onMobileClose && (
        <button
          onClick={onMobileClose}
          className="lg:hidden absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10"
          aria-label="Close menu"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
    </aside>
  );
}
