"use client";

import Header from "@/components/layout/header";
import { Megaphone } from "lucide-react";

export default function StudentAnnouncementsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Announcements"
        subtitle="Stay updated with the latest news"
      />

      <div className="flex flex-col items-center justify-center p-6 min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-cjc-gold/10 flex items-center justify-center mx-auto mb-6">
            <Megaphone className="w-10 h-10 text-cjc-gold" />
          </div>
          <h2 className="text-2xl font-display font-bold text-cjc-navy mb-2">
            Coming Soon
          </h2>
          <p className="text-warm-muted max-w-md">
            The announcements feature is currently under development. Check back soon for updates and important notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
