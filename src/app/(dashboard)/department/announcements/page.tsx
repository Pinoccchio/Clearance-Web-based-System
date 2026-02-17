"use client";

import { useState, useEffect, useCallback } from "react";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import {
  Megaphone,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  RefreshCw,
  Calendar,
  MapPin,
  Clock,
  Inbox,
} from "lucide-react";
import {
  Department,
  AnnouncementWithRelations,
  getDepartmentByHeadId,
  getAnnouncementsByDepartment,
  getActiveAnnouncements,
  deleteAnnouncement,
} from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { AnnouncementFormModal } from "@/components/features/AnnouncementFormModal";
import { AnnouncementDetailModal } from "@/components/features/AnnouncementDetailModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";

const priorityColors = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-100 text-blue-600",
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
  normal: "border-l-4 border-l-blue-400",
  high: "border-l-4 border-l-amber-400",
  urgent: "border-l-4 border-l-red-500",
};

export default function DepartmentAnnouncementsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"manage" | "received">("manage");

  const [department, setDepartment] = useState<Department | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementWithRelations[]>([]);
  const [receivedAnnouncements, setReceivedAnnouncements] = useState<AnnouncementWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementWithRelations | undefined>(undefined);

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailAnnouncement, setDetailAnnouncement] = useState<AnnouncementWithRelations | null>(null);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<AnnouncementWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    setError(null);
    try {
      const dept = await getDepartmentByHeadId(profile.id);
      if (!dept) {
        setError("No department found for your account.");
        setIsLoading(false);
        return;
      }
      setDepartment(dept);
      const [myData, activeData] = await Promise.all([
        getAnnouncementsByDepartment(dept.id),
        getActiveAnnouncements(),
      ]);
      setAnnouncements(myData);
      // Received: system-wide only (from admin/others), exclude own posts
      const received = activeData.filter(
        (a) => a.is_system_wide && a.posted_by_id !== profile.id
      );
      setReceivedAnnouncements(received);
    } catch (err) {
      console.error("Error fetching department announcements:", err);
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

  const isExpired = (a: AnnouncementWithRelations) => {
    if (!a.expires_at) return false;
    return new Date(a.expires_at) < new Date();
  };

  const stats = {
    total: announcements.length,
    active: announcements.filter((a) => a.is_active && !isExpired(a)).length,
    expired: announcements.filter((a) => isExpired(a)).length,
    urgent: announcements.filter((a) => a.priority === "urgent").length,
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "all" || a.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const filteredReceived = receivedAnnouncements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "all" || a.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

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
    club: "Club", student: "Student",
  };
  const getPostedByName = (a: AnnouncementWithRelations) => {
    if (!a.posted_by) return "Unknown";
    const role = roleLabel[a.posted_by.role] ?? a.posted_by.role;
    return `${a.posted_by.first_name} ${a.posted_by.last_name} (${role})`;
  };

  const handleAddAnnouncement = () => {
    setFormMode("add");
    setSelectedAnnouncement(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditAnnouncement = (a: AnnouncementWithRelations) => {
    setFormMode("edit");
    setSelectedAnnouncement(a);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (a: AnnouncementWithRelations) => {
    setAnnouncementToDelete(a);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAnnouncement(announcementToDelete.id);
      showToast("success", "Announcement Deleted", "The announcement has been deleted.");
      fetchData();
    } catch (err) {
      console.error("Error deleting announcement:", err);
      showToast("error", "Error", "Failed to delete announcement");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
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
          <p className="text-sm text-warm-muted">
            {department ? department.name : "Department"}
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

        {/* Tab Switcher */}
        <div className="flex border-b border-border-warm">
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "manage"
                ? "border-cjc-navy text-cjc-navy"
                : "border-transparent text-warm-muted hover:text-cjc-navy"
            }`}
          >
            <Edit2 className="w-4 h-4" />
            My Announcements ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab("received")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "received"
                ? "border-cjc-navy text-cjc-navy"
                : "border-transparent text-warm-muted hover:text-cjc-navy"
            }`}
          >
            <Inbox className="w-4 h-4" />
            Received ({receivedAnnouncements.length})
          </button>
        </div>

        {/* ── MANAGE TAB ── */}
        {activeTab === "manage" && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-cjc-navy">{stats.total}</p>
                <p className="text-sm text-warm-muted">Total</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-success">{stats.active}</p>
                <p className="text-sm text-warm-muted">Active</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-warm-muted">{stats.expired}</p>
                <p className="text-sm text-warm-muted">Expired</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-red-500">{stats.urgent}</p>
                <p className="text-sm text-warm-muted">Urgent</p>
              </div>
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
              <div className="flex gap-2">
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  className="btn btn-secondary"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
                <button onClick={handleAddAnnouncement} className="btn btn-gold">
                  <Plus className="w-4 h-4" />
                  New Announcement
                </button>
              </div>
            </div>

            {/* Loading */}
            {isLoading && announcements.length === 0 && (
              <div className="card p-12 text-center">
                <Loader2 className="w-8 h-8 text-cjc-blue animate-spin mx-auto mb-3" />
                <p className="text-warm-muted">Loading announcements...</p>
              </div>
            )}

            {/* Table */}
            {!isLoading && filteredAnnouncements.length > 0 && (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-warm border-b border-border-warm">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Announcement</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Posted By</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Created</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-cjc-navy">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-warm">
                      {filteredAnnouncements.map((announcement) => {
                        const expired = isExpired(announcement);
                        const canEdit = announcement.posted_by_id === profile.id;
                        return (
                          <tr key={announcement.id} className="hover:bg-surface-warm transition-colors">
                            <td className="py-3 px-4">
                              <div className="max-w-md">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[announcement.priority]}`}>
                                    {priorityLabels[announcement.priority]}
                                  </span>
                                  <p className="font-medium text-cjc-navy truncate">{announcement.title}</p>
                                </div>
                                <p className="text-xs text-warm-muted line-clamp-1 mt-1">{announcement.content}</p>
                                {(announcement.event_date || announcement.event_location) && (
                                  <div className="flex items-center gap-3 mt-1 text-xs text-warm-muted">
                                    {announcement.event_date && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(announcement.event_date)}
                                      </span>
                                    )}
                                    {announcement.event_location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {announcement.event_location}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={announcement.posted_by?.avatar_url || undefined}
                                  name={getPostedByName(announcement)}
                                  size="sm"
                                />
                                <div>
                                  <p className="text-sm text-cjc-navy font-medium">{getPostedByName(announcement)}</p>
                                  <p className="text-xs text-warm-muted">{announcement.posted_by?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {expired ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                                  <Clock className="w-3 h-3" />
                                  Expired
                                </span>
                              ) : announcement.is_active ? (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">Active</span>
                              ) : (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">Inactive</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-warm-muted">{formatDate(announcement.created_at)}</p>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-1">
                                {canEdit && (
                                  <>
                                    <button
                                      onClick={() => handleEditAnnouncement(announcement)}
                                      className="p-2 hover:bg-surface-warm rounded-lg transition-colors"
                                      title="Edit announcement"
                                    >
                                      <Edit2 className="w-4 h-4 text-warm-muted" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(announcement)}
                                      className="p-2 hover:bg-danger/10 rounded-lg transition-colors"
                                      title="Delete announcement"
                                    >
                                      <Trash2 className="w-4 h-4 text-danger" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredAnnouncements.length === 0 && (
              <div className="card p-12 text-center">
                <Megaphone className="w-12 h-12 text-warm-muted mx-auto mb-3" />
                {announcements.length === 0 ? (
                  <>
                    <h2 className="text-lg font-semibold text-cjc-navy mb-1">No Announcements Yet</h2>
                    <p className="text-warm-muted mb-4">Post your first announcement to students in your department.</p>
                    <button onClick={handleAddAnnouncement} className="btn btn-gold">
                      <Plus className="w-4 h-4" />
                      Post Announcement
                    </button>
                  </>
                ) : (
                  <p className="text-warm-muted">No announcements match your search.</p>
                )}
              </div>
            )}
          </>
        )}

        {/* ── RECEIVED TAB ── */}
        {activeTab === "received" && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
                <input
                  placeholder="Search received announcements..."
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
            {!isLoading && filteredReceived.length === 0 && (
              <div className="card p-12 text-center">
                <Inbox className="w-12 h-12 text-warm-muted mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-cjc-navy mb-1">No Received Announcements</h2>
                <p className="text-warm-muted">System-wide announcements from administrators will appear here.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Announcement Form Modal */}
      {profile && (
        <AnnouncementFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={fetchData}
          mode={formMode}
          announcement={selectedAnnouncement}
          currentUser={profile}
          departmentId={department?.id}
        />
      )}

      {/* Detail Modal */}
      <AnnouncementDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setDetailAnnouncement(null); }}
        announcement={detailAnnouncement}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setAnnouncementToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${announcementToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
