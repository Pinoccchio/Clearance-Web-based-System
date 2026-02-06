"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading, isAuthenticated, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Route protection via useEffect - handles redirects after auth state is determined
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/');
        return;
      }
      // Check role matches route
      const roleFromPath = pathname.split('/')[1];
      if (profile && roleFromPath !== profile.role) {
        router.push(`/${profile.role}`);
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
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
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
