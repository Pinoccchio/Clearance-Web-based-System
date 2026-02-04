"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import { mockUsers } from "@/lib/mock-data";
import { UserRole } from "@/lib/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determine role from pathname
  const roleFromPath = pathname.split("/")[1] as UserRole;
  const validRoles: UserRole[] = ["student", "department", "organization", "dean", "admin"];
  const role = validRoles.includes(roleFromPath) ? roleFromPath : "student";

  const user = mockUsers[role];
  const userName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar role={role} userName={userName} userEmail={user.email} />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
