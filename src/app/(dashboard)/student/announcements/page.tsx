"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/header";
import {
  Megaphone,
  Search,
  Loader2,
  Calendar,
  MapPin,
  Globe,
  Building2,
  Users,
  User,
} from "lucide-react";
import {
  AnnouncementWithRelations,
  getActiveAnnouncements,
} from "@/lib/supabase";

type FilterType = "all" | "system" | "department" | "office" | "club";

const priorityColors = {
  low: "bg-gray-100 text-gray-600 border-gray-200",
  normal: "bg-blue-100 text-blue-600 border-blue-200",
  high: "bg-amber-100 text-amber-600 border-amber-200",
  urgent: "bg-red-100 text-red-600 border-red-200",
};

const priorityLabels = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const priorityOrder = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Fetch active announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getActiveAnnouncements();
      // Sort by priority (urgent first) then by date (newest first)
      const sorted = data.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setAnnouncements(sorted);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Get announcement scope
  const getAnnouncementScope = (announcement: AnnouncementWithRelations): FilterType => {
    if (announcement.is_system_wide) return "system";
    if (announcement.department_id) return "department";
    if (announcement.office_id) return "office";
    if (announcement.club_id) return "club";
    return "system";
  };

  // Get source display
  const getSourceDisplay = (announcement: AnnouncementWithRelations) => {
    if (announcement.is_system_wide) {
      return { label: "System Announcement", icon: Globe, color: "text-purple-600 bg-purple-50" };
    }
    if (announcement.department) {
      return { label: announcement.department.name, icon: Building2, color: "text-blue-600 bg-blue-50" };
    }
    if (announcement.office) {
      return { label: announcement.office.name, icon: Building2, color: "text-green-600 bg-green-50" };
    }
    if (announcement.club) {
      return { label: announcement.club.name, icon: Users, color: "text-orange-600 bg-orange-50" };
    }
    return { label: "Announcement", icon: Globe, color: "text-gray-600 bg-gray-50" };
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    // Search filter
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType =
      filterType === "all" || getAnnouncementScope(announcement) === filterType;

    return matchesSearch && matchesType;
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(dateString);
  };

  // Get poster name
  const getPostedByName = (announcement: AnnouncementWithRelations) => {
    if (!announcement.posted_by) return "Unknown";
    return `${announcement.posted_by.first_name} ${announcement.posted_by.last_name}`;
  };

  const filterTabs: { value: FilterType; label: string; icon: typeof Globe }[] = [
    { value: "all", label: "All", icon: Megaphone },
    { value: "system", label: "System", icon: Globe },
    { value: "department", label: "Departments", icon: Building2 },
    { value: "office", label: "Offices", icon: Building2 },
    { value: "club", label: "Clubs", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Announcements"
        subtitle="Stay updated with the latest news"
      />

      <div className="p-6 space-y-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setFilterType(tab.value)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === tab.value
                    ? "bg-cjc-blue text-white"
                    : "bg-white text-warm-muted hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
          <input
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-3 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cjc-blue animate-spin mb-3" />
            <p className="text-warm-muted">Loading announcements...</p>
          </div>
        )}

        {/* Announcements List */}
        {!isLoading && filteredAnnouncements.length > 0 && (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => {
              const source = getSourceDisplay(announcement);
              const SourceIcon = source.icon;

              return (
                <div
                  key={announcement.id}
                  className={`bg-white rounded-xl border-l-4 shadow-sm overflow-hidden ${
                    announcement.priority === "urgent"
                      ? "border-l-red-500"
                      : announcement.priority === "high"
                      ? "border-l-amber-500"
                      : announcement.priority === "normal"
                      ? "border-l-blue-500"
                      : "border-l-gray-300"
                  }`}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Priority Badge */}
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                            priorityColors[announcement.priority]
                          }`}
                        >
                          {priorityLabels[announcement.priority]}
                        </span>
                        {/* Source Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${source.color}`}
                        >
                          <SourceIcon className="w-3 h-3" />
                          {source.label}
                        </span>
                      </div>
                      {/* Time */}
                      <span className="text-xs text-warm-muted">
                        {formatRelativeTime(announcement.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-cjc-navy mb-2">
                      {announcement.title}
                    </h3>

                    {/* Content */}
                    <p className="text-sm text-gray-600 whitespace-pre-line mb-4">
                      {announcement.content}
                    </p>

                    {/* Event Info */}
                    {(announcement.event_date || announcement.event_location) && (
                      <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg mb-4">
                        {announcement.event_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-cjc-gold" />
                            <span className="text-gray-700">
                              {formatDate(announcement.event_date)}
                            </span>
                          </div>
                        )}
                        {announcement.event_location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-cjc-gold" />
                            <span className="text-gray-700">
                              {announcement.event_location}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-2 text-xs text-warm-muted pt-3 border-t border-gray-100">
                      <User className="w-3.5 h-3.5" />
                      <span>Posted by {getPostedByName(announcement)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredAnnouncements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-cjc-gold/10 flex items-center justify-center mb-6">
              <Megaphone className="w-10 h-10 text-cjc-gold" />
            </div>
            <h3 className="text-xl font-semibold text-cjc-navy mb-2">
              No Announcements
            </h3>
            <p className="text-warm-muted text-center max-w-md">
              {searchQuery || filterType !== "all"
                ? "No announcements found matching your criteria. Try adjusting your filters."
                : "There are no announcements at the moment. Check back later for updates."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
