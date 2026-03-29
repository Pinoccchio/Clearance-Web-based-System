"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading, isAuthenticated, logout, orgLogo, orgName } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Route protection via useEffect - handles redirects after auth state is determined
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/');
        return;
      }
      // Check role matches route — roles use underscores, URLs use hyphens
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

  // Show loading state while auth is being checked
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

  // If not authenticated, show loading while redirect happens
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

  // Get the role from the profile
  const role = profile.role as UserRole;
  const userName = `${profile.first_name} ${profile.last_name}`;
  const isCsp = !!(profile.cspsp_division || profile.department === "CSP");

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
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
      />

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-200",
        isSidebarCollapsed ? "ml-[72px]" : "ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}
