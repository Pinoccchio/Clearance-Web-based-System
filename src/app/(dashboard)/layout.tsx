"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  History,
  FolderOpen,
  Users,
  Menu,
  Calendar,
  Settings,
  Megaphone,
  CheckSquare,
} from "lucide-react";

// Bottom nav items per role — max 4 + "More"
function getBottomNavItems(role: UserRole) {
  const roleToPath: Record<string, string> = { csg_lgu: "csg-lgu", cspsp_division: "cspsp-division" };
  const base = roleToPath[role] ?? role;

  switch (role) {
    case "student":
      return [
        { label: "Home", href: "/student", icon: LayoutDashboard },
        { label: "Status", href: "/student/department/clearance", icon: ClipboardList },
        { label: "Documents", href: "/student/documents", icon: FolderOpen },
        { label: "History", href: "/student/history", icon: History },
      ];
    case "admin":
      return [
        { label: "Home", href: "/admin", icon: LayoutDashboard },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Events", href: "/admin/events", icon: Calendar },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ];
    case "department":
      return [
        { label: "Home", href: `/${base}`, icon: LayoutDashboard },
        { label: "Queue", href: `/${base}/clearance`, icon: ClipboardList },
        { label: "Students", href: `/${base}/students`, icon: Users },
        { label: "History", href: `/${base}/history`, icon: History },
      ];
    case "office":
      return [
        { label: "Home", href: `/${base}`, icon: LayoutDashboard },
        { label: "Queue", href: `/${base}/clearance`, icon: ClipboardList },
        { label: "Students", href: `/${base}/students`, icon: Users },
        { label: "History", href: `/${base}/history`, icon: History },
      ];
    default:
      return [
        { label: "Home", href: `/${base}`, icon: LayoutDashboard },
        { label: "Queue", href: `/${base}/clearance`, icon: ClipboardList },
        { label: "Requirements", href: `/${base}/requirements`, icon: CheckSquare },
        { label: "History", href: `/${base}/history`, icon: History },
      ];
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading, isAuthenticated, logout, orgLogo, orgName } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Route protection via useEffect - handles redirects after auth state is determined
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/');
        return;
      }
      const roleToPath: Record<string, string> = { csg_lgu: 'csg-lgu', cspsp_division: 'cspsp-division' };
      const pathToRole: Record<string, string> = { 'csg-lgu': 'csg_lgu', 'cspsp-division': 'cspsp_division' };
      const pathSegment = pathname.split('/')[1];
      const roleFromPath = pathToRole[pathSegment] ?? pathSegment;
      if (profile && roleFromPath !== profile.role) {
        const targetPath = roleToPath[profile.role] ?? profile.role;
        router.push(`/${targetPath}`);
      }
    }
  }, [isLoading, isAuthenticated, profile, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cjc-navy/20 border-t-cjc-navy rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cjc-navy/20 border-t-cjc-navy rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const role = profile.role as UserRole;
  const userName = `${profile.first_name} ${profile.last_name}`;
  const isCsp = !!(profile.cspsp_division || profile.department === "CSP");
  const bottomNavItems = getBottomNavItems(role);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 lg:z-40 transition-transform duration-200 lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <Sidebar
          role={role}
          userName={userName}
          userEmail={profile.email}
          userAvatar={profile.avatar_url ?? null}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onLogout={handleLogout}
          orgLogo={orgLogo}
          orgName={orgName}
          isCsp={isCsp}
          onMobileClose={() => setIsMobileOpen(false)}
        />
      </div>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-200",
        // Mobile: full width + bottom padding for nav bar; Desktop: sidebar margin
        "ml-0 pb-16 lg:pb-0 lg:ml-64",
        isSidebarCollapsed && "lg:ml-[72px]"
      )}>
        {children}
      </main>

      {/* Bottom Navigation — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-stretch">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== `/${role}` && item.href !== "/student" && item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px]",
                  isActive
                    ? "text-cjc-red font-semibold"
                    : "text-gray-500"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {/* More button — opens sidebar drawer */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] text-gray-500"
          >
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
