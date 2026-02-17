"use client";

import Header from "@/components/layout/header";
import { Card } from "@/components/ui/Card";
import { Megaphone } from "lucide-react";

export default function StudentAnnouncementsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Announcements" subtitle="System and department notices" />
      <div className="flex items-center justify-center p-12">
        <Card padding="lg" className="text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-cjc-navy mb-1">Announcements</h3>
          <p className="text-sm text-gray-500">This feature is coming soon.</p>
        </Card>
      </div>
    </div>
  );
}
