"use client";

import { useState, useEffect, useCallback } from "react";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import {
  Megaphone,
  Search,
  Loader2,
  RefreshCw,
  Calendar,
  MapPin,
  Clock,
  Inbox,
} from "lucide-react";
import {
  CsgLgu,
  AnnouncementWithRelations,
  getCsgLguByHeadId,
  getActiveAnnouncements,
  getAnnouncementsByCsgLgu,
} from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { AnnouncementDetailModal } from "@/components/features/AnnouncementDetailModal";
import { useToast } from "@/components/ui/Toast";

const priorityColors = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-cjc-blue/10 text-cjc-blue",
  high: "bg-amber-100 text-amber-600",
  urgent: "bg-red-100 text-red-600",
};

const priorityLabels = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const priorityCardBorder = {
  low: "border-l-4 border-l-gray-400",
  normal: "border-l-4 border-l-cjc-blue",
  high: "border-l-4 border-l-amber-400",
  urgent: "border-l-4 border-l-red-500",
};

export default function CsgLguAnnouncementsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [lgu, setLgu] = useState<CsgLgu | null>(null);
  const [receivedAnnouncements, setReceivedAnnouncements] = useState<AnnouncementWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailAnnouncement, setDetailAnnouncement] = useState<AnnouncementWithRelations | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    setError(null);
    try {
      const lguData = await getCsgLguByHeadId(profile.id);
      if (!lguData) {
        setError("No CSG LGU found for your account.");
        setIsLoading(false);
        return;
      }
      setLgu(lguData);
      const [activeData, ownAnnouncements] = await Promise.all([
        getActiveAnnouncements(),
        getAnnouncementsByCsgLgu(lguData.id),
      ]);
      // Received: system-wide (from admin/others) + own org announcements
      const received = activeData.filter(
        (a) => a.is_system_wide && a.posted_by_id !== profile.id
      );
      // Combine and deduplicate
      const allAnnouncements = [...received, ...ownAnnouncements.filter(
        (a) => a.is_active && !received.some((r) => r.id === a.id)
      )];
      setReceivedAnnouncements(allAnnouncements);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError("Failed to load announcements.");
      showToast("error", "Error", "Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  }, [profile, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRealtimeRefresh('announcements', fetchData);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatDateShort = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const roleLabel: Record<string, string> = {
    admin: "Admin", department: "Department", office: "Office",
    club: "Club", student: "Student", csg_lgu: "CSG LGU",
  };
  const getPostedByName = (a: AnnouncementWithRelations) => {
    if (!a.posted_by) return "Unknown";
    const role = roleLabel[a.posted_by.role] ?? a.posted_by.role;
    return `${a.posted_by.first_name} ${a.posted_by.last_name} (${role})`;
  };

  const handleCardClick = (a: AnnouncementWithRelations) => {
    setDetailAnnouncement(a);
    setIsDetailModalOpen(true);
  };

  const filteredReceived = receivedAnnouncements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "all" || a.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface-warm flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cjc-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">
            {lgu ? lgu.name : "CSG LGU"}
          </p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">Announcements</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Error state */}
        {error && (
          <div className="card p-6 text-center text-red-600">
            <p>{error}</p>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
            <input
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 px-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="btn btn-secondary"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 text-cjc-blue animate-spin mx-auto mb-3" />
            <p className="text-warm-muted">Loading announcements...</p>
          </div>
        )}

        {/* Card Feed */}
        {!isLoading && filteredReceived.length > 0 && (
          <div className="space-y-3">
            {filteredReceived.map((a) => (
              <div
                key={a.id}
                onClick={() => handleCardClick(a)}
                className={`card p-4 cursor-pointer hover:shadow-md transition-shadow ${priorityCardBorder[a.priority]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[a.priority]}`}>
                        {priorityLabels[a.priority]}
                      </span>
                      <span className="text-xs text-warm-muted">System-wide</span>
                    </div>
                    <h3 className="font-semibold text-cjc-navy truncate">{a.title}</h3>
                    <p className="text-sm text-warm-muted line-clamp-2 mt-0.5">{a.content}</p>
                    {(a.event_date || a.event_location) && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-warm-muted">
                        {a.event_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(a.event_date)}
                          </span>
                        )}
                        {a.event_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {a.event_location}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-warm-muted shrink-0">
                    <p>{getPostedByName(a)}</p>
                    <p className="mt-0.5">{formatDateShort(a.created_at)}</p>
                    {a.expires_at && (
                      <p className="text-warning mt-0.5 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        Exp. {formatDateShort(a.expires_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredReceived.length === 0 && !error && (
          <div className="card p-12 text-center">
            <Inbox className="w-12 h-12 text-warm-muted mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-cjc-navy mb-1">No Announcements</h2>
            <p className="text-warm-muted">System-wide announcements from administrators will appear here.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnnouncementDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setDetailAnnouncement(null); }}
        announcement={detailAnnouncement}
      />
    </div>
  );
}
