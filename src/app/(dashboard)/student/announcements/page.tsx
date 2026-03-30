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
  Globe,
  BookOpen,
  Building2,
  Users,
  Shield,
} from "lucide-react";
import { AnnouncementWithRelations, getActiveAnnouncements } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { AnnouncementDetailModal } from "@/components/features/AnnouncementDetailModal";
import { Select } from "@/components/ui/Select";

const priorityColors = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-gray-100 text-gray-600",
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
  normal: "border-l-4 border-l-gray-400",
  high: "border-l-4 border-l-amber-400",
  urgent: "border-l-4 border-l-red-500",
};

const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };

export default function StudentAnnouncementsPage() {
  const { profile } = useAuth();

  const [announcements, setAnnouncements] = useState<AnnouncementWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "system" | "department" | "office" | "club" | "csg_lgu" | "cspsp_division">("all");

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailAnnouncement, setDetailAnnouncement] = useState<AnnouncementWithRelations | null>(null);

  const isCsp = !!(profile?.cspsp_division || profile?.department === "CSP");

  const loadData = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    setError(null);
    try {
      const all = await getActiveAnnouncements();
      // Parse enrolled club IDs
      const enrolledClubIds = profile.enrolled_clubs
        ? profile.enrolled_clubs.split(",").map((id) => id.trim()).filter(Boolean)
        : [];
      // Show system-wide announcements, department-specific, or club-specific
      // CSP students see CSPSP Division announcements only; regular students see CSG LGU only
      const visible = all.filter(
        (a) =>
          a.is_system_wide ||
          (a.department_id && a.department?.code === profile.department) ||
          (a.office_id) ||
          (a.club_id && enrolledClubIds.includes(a.club_id)) ||
          (a.csg_lgu_id && !isCsp) ||
          (a.cspsp_division_id && isCsp)
      );
      // Sort by priority then date
      visible.sort((a, b) => {
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setAnnouncements(visible);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError("Failed to load announcements.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtimeRefresh('announcements', loadData);

  const getAnnouncementScope = (a: AnnouncementWithRelations): "system" | "department" | "office" | "club" | "csg_lgu" | "cspsp_division" => {
    if (a.is_system_wide) return "system";
    if (a.department_id) return "department";
    if (a.office_id) return "office";
    if (a.club_id) return "club";
    if (a.csg_lgu_id) return "csg_lgu";
    if (a.cspsp_division_id) return "cspsp_division";
    return "system";
  };

  const filtered = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "all" || a.priority === priorityFilter;
    const matchesScope = scopeFilter === "all" || getAnnouncementScope(a) === scopeFilter;
    return matchesSearch && matchesPriority && matchesScope;
  });

  const stats = {
    total: announcements.length,
    urgent: announcements.filter((a) => a.priority === "urgent").length,
    systemWide: announcements.filter((a) => a.is_system_wide).length,
    deptSpecific: announcements.filter((a) => !a.is_system_wide && a.department_id).length,
    officeSpecific: announcements.filter((a) => !a.is_system_wide && a.office_id).length,
    clubSpecific: announcements.filter((a) => !a.is_system_wide && a.club_id).length,
    csgLguSpecific: announcements.filter((a) => !a.is_system_wide && a.csg_lgu_id).length,
    cspspSpecific: announcements.filter((a) => !a.is_system_wide && a.cspsp_division_id).length,
  };

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
    club: "Club", student: "Student", csg_lgu: "CSG LGU", cspsp_division: "CSPSP Division",
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
          <p className="text-sm text-warm-muted">Student Portal</p>
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-navy">{stats.total}</p>
            <p className="text-sm text-warm-muted">Total</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.urgent}</p>
            <p className="text-sm text-warm-muted">Urgent</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-blue">{stats.systemWide}</p>
            <p className="text-sm text-warm-muted">System-wide</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.deptSpecific}</p>
            <p className="text-sm text-warm-muted">Department</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.officeSpecific}</p>
            <p className="text-sm text-warm-muted">Offices</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-purple-500">{stats.clubSpecific}</p>
            <p className="text-sm text-warm-muted">Clubs</p>
          </div>
          {!isCsp && (
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-indigo-500">{stats.csgLguSpecific}</p>
              <p className="text-sm text-warm-muted">CSG LGU</p>
            </div>
          )}
          {isCsp && (
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-teal-500">{stats.cspspSpecific}</p>
              <p className="text-sm text-warm-muted">CSPSP Div</p>
            </div>
          )}
        </div>

        {/* Scope Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {([
            { value: "all" as const, label: "All", count: announcements.length },
            { value: "system" as const, label: "System", count: stats.systemWide },
            { value: "department" as const, label: "Department", count: stats.deptSpecific },
            { value: "office" as const, label: "Offices", count: stats.officeSpecific },
            { value: "club" as const, label: "Clubs", count: stats.clubSpecific },
            ...(!isCsp ? [{ value: "csg_lgu" as const, label: "CSG LGU", count: stats.csgLguSpecific }] : []),
            ...(isCsp ? [{ value: "cspsp_division" as const, label: "CSPSP Div", count: stats.cspspSpecific }] : []),
          ]).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setScopeFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scopeFilter === tab.value
                  ? "bg-cjc-red text-white"
                  : "bg-white text-warm-muted hover:bg-gray-50 border border-border-warm"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${
                scopeFilter === tab.value ? "text-white/70" : "text-warm-muted"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

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
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { value: "all", label: "All Priorities" },
              { value: "urgent", label: "Urgent" },
              { value: "high", label: "High" },
              { value: "normal", label: "Normal" },
              { value: "low", label: "Low" },
            ]}
          />
          <button
            onClick={loadData}
            disabled={isLoading}
            className="btn btn-secondary"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 text-cjc-blue animate-spin mx-auto mb-3" />
            <p className="text-warm-muted">Loading announcements...</p>
          </div>
        )}

        {/* Card Feed */}
        {!isLoading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((a) => (
              <div
                key={a.id}
                onClick={() => handleCardClick(a)}
                className={`card p-4 cursor-pointer hover:shadow-md transition-shadow ${priorityCardBorder[a.priority]}`}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[a.priority]}`}>
                        {priorityLabels[a.priority]}
                      </span>
                      {a.is_system_wide ? (
                        <span className="inline-flex items-center gap-1 text-xs text-cjc-blue bg-cjc-blue/5 px-2 py-0.5 rounded-full">
                          <Globe className="w-3 h-3" />
                          System-wide
                        </span>
                      ) : a.office_id ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <Building2 className="w-3 h-3" />
                          {a.office?.name ?? "Office"}
                        </span>
                      ) : a.club_id ? (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                          <Users className="w-3 h-3" />
                          {a.club?.name ?? "Club"}
                        </span>
                      ) : a.csg_lgu_id ? (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          <Shield className="w-3 h-3" />
                          {a.csg_lgu?.name ?? "CSG LGU"}
                        </span>
                      ) : a.cspsp_division_id ? (
                        <span className="inline-flex items-center gap-1 text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                          <Building2 className="w-3 h-3" />
                          {a.cspsp_division?.name ?? "CSPSP Division"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <BookOpen className="w-3 h-3" />
                          {a.department?.name ?? "Department"}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-cjc-navy">{a.title}</h3>
                    <p className="text-sm text-warm-muted line-clamp-2 mt-0.5">{a.content}</p>
                    {(a.event_date || a.event_location) && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-warm-muted flex-wrap">
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
                  <div className="hidden sm:block text-right text-xs text-warm-muted shrink-0">
                    <p className="font-medium">{getPostedByName(a)}</p>
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
        {!isLoading && !error && filtered.length === 0 && (
          <div className="card p-12 text-center">
            <Megaphone className="w-12 h-12 text-warm-muted mx-auto mb-3" />
            {announcements.length === 0 ? (
              <>
                <h2 className="text-lg font-semibold text-cjc-navy mb-1">No Announcements</h2>
                <p className="text-warm-muted">There are no active announcements for you right now.</p>
              </>
            ) : (
              <p className="text-warm-muted">No announcements match your filters.</p>
            )}
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
