"use client";

import Header from "@/components/layout/header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Megaphone, Calendar, User, AlertTriangle, Info, Bell } from "lucide-react";
import { announcements } from "@/lib/mock-data";

export default function StudentAnnouncementsPage() {
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "urgent": return "danger";
      case "high": return "warning";
      case "medium": return "info";
      default: return "neutral";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="w-4 h-4" />;
      case "high": return <Bell className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Announcements"
        subtitle="Stay updated with the latest news"
      />

      <div className="p-6 space-y-6">
        {/* Urgent Announcements */}
        {announcements.filter(a => a.priority === "urgent").length > 0 && (
          <Card padding="lg" className="border-l-4 border-l-red-500 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Urgent Announcements
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {announcements.filter(a => a.priority === "urgent").map((announcement) => (
                <div key={announcement.id} className="p-4 bg-white rounded-lg border border-red-100">
                  <h3 className="font-semibold text-cjc-navy mb-2">{announcement.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{announcement.content}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {announcement.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* All Announcements */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-cjc-gold" />
              All Announcements
            </CardTitle>
            <Badge variant="info">{announcements.length} announcements</Badge>
          </CardHeader>

          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-semibold text-cjc-navy">{announcement.title}</h3>
                    <Badge variant={getPriorityVariant(announcement.priority)} size="sm">
                      {getPriorityIcon(announcement.priority)}
                      <span className="capitalize">{announcement.priority}</span>
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{announcement.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {announcement.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No announcements"
              description="There are no announcements at the moment"
              icon={<Megaphone className="w-8 h-8 text-gray-400" />}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
