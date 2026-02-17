"use client";

import Header from "@/components/layout/header";
import { Card } from "@/components/ui/Card";
import { LayoutDashboard } from "lucide-react";

export default function StudentDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Student Dashboard" subtitle="Overview of your clearance status" />
      <div className="flex items-center justify-center p-12">
        <Card padding="lg" className="text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-cjc-navy mb-1">Student Dashboard</h3>
          <p className="text-sm text-gray-500">This feature is coming soon.</p>
        </Card>
      </div>
    </div>
  );
}
