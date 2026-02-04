"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import { mockUsers } from "@/lib/mock-data";
import { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Determine role from pathname
  const roleFromPath = pathname.split("/")[1] as UserRole;
  const validRoles: UserRole[] = ["student", "office", "academic-club", "non-academic-club", "admin"];
  const role = validRoles.includes(roleFromPath) ? roleFromPath : "student";

  const user = mockUsers[role];
  const userName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        role={role}
        userName={userName}
        userEmail={user.email}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
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
