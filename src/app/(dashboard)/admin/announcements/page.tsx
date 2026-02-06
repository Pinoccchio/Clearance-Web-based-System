"use client";

import { useState, useEffect, useCallback } from "react";
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
  Building2,
  Users,
  Globe,
} from "lucide-react";
import {
  AnnouncementWithRelations,
  getAllAnnouncements,
  deleteAnnouncement,
  getCurrentProfile,
  Profile,
} from "@/lib/supabase";
import { AnnouncementFormModal } from "@/components/features/AnnouncementFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";

type FilterType = "all" | "system" | "department" | "office" | "club";

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

export default function AdminAnnouncementsPage() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<
    AnnouncementWithRelations | undefined
  >(undefined);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<
    AnnouncementWithRelations | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch current user
  useEffect(() => {
    getCurrentProfile().then(setCurrentUser);
  }, []);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      showToast("error", "Error", "Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

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

  // Get scope display
  const getScopeDisplay = (announcement: AnnouncementWithRelations) => {
    if (announcement.is_system_wide) {
      return { label: "System-wide", icon: Globe, color: "text-purple-600 bg-purple-100" };
    }
    if (announcement.department) {
      return { label: announcement.department.name, icon: Building2, color: "text-blue-600 bg-blue-100" };
    }
    if (announcement.office) {
      return { label: announcement.office.name, icon: Building2, color: "text-green-600 bg-green-100" };
    }
    if (announcement.club) {
      return { label: announcement.club.name, icon: Users, color: "text-orange-600 bg-orange-100" };
    }
    return { label: "Unknown", icon: Globe, color: "text-gray-600 bg-gray-100" };
  };

  // Check if announcement is expired
  const isExpired = (announcement: AnnouncementWithRelations) => {
    if (!announcement.expires_at) return false;
    return new Date(announcement.expires_at) < new Date();
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    // Search filter
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.posted_by?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.posted_by?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType =
      filterType === "all" || getAnnouncementScope(announcement) === filterType;

    return matchesSearch && matchesType;
  });

  // Statistics
  const stats = {
    total: announcements.length,
    active: announcements.filter((a) => a.is_active && !isExpired(a)).length,
    expired: announcements.filter((a) => isExpired(a)).length,
    urgent: announcements.filter((a) => a.priority === "urgent").length,
  };

  // Handle add announcement
  const handleAddAnnouncement = () => {
    setFormMode("add");
    setSelectedAnnouncement(undefined);
    setIsFormModalOpen(true);
  };

  // Handle edit announcement
  const handleEditAnnouncement = (announcement: AnnouncementWithRelations) => {
    setFormMode("edit");
    setSelectedAnnouncement(announcement);
    setIsFormModalOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (announcement: AnnouncementWithRelations) => {
    setAnnouncementToDelete(announcement);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;

    setIsDeleting(true);
    try {
      await deleteAnnouncement(announcementToDelete.id);
      showToast(
        "success",
        "Announcement Deleted",
        "The announcement has been deleted."
      );
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      showToast("error", "Error", "Failed to delete announcement");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

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

  // Format poster name
  const getPostedByName = (announcement: AnnouncementWithRelations) => {
    if (!announcement.posted_by) return "Unknown";
    return `${announcement.posted_by.first_name} ${announcement.posted_by.last_name}`;
  };

  const filterTabs: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "system", label: "System" },
    { value: "department", label: "Department" },
    { value: "office", label: "Office" },
    { value: "club", label: "Club" },
  ];

  if (!currentUser) {
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
          <p className="text-sm text-warm-muted">System Administration</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">
            Announcements
          </h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
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

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === tab.value
                  ? "bg-cjc-blue text-white"
                  : "bg-white text-warm-muted hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Actions */}
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
          <div className="flex gap-2">
            <button
              onClick={fetchAnnouncements}
              disabled={isLoading}
              className="btn btn-secondary"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button onClick={handleAddAnnouncement} className="btn btn-gold">
              <Plus className="w-4 h-4" />
              New Announcement
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && announcements.length === 0 && (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 text-cjc-blue animate-spin mx-auto mb-3" />
            <p className="text-warm-muted">Loading announcements...</p>
          </div>
        )}

        {/* Announcements Table */}
        {!isLoading && filteredAnnouncements.length > 0 && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-warm border-b border-border-warm">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                      Announcement
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                      Scope
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                      Posted By
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                      Created
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-cjc-navy">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm">
                  {filteredAnnouncements.map((announcement) => {
                    const scope = getScopeDisplay(announcement);
                    const ScopeIcon = scope.icon;
                    const expired = isExpired(announcement);

                    return (
                      <tr
                        key={announcement.id}
                        className="hover:bg-surface-warm transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="max-w-md">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  priorityColors[announcement.priority]
                                }`}
                              >
                                {priorityLabels[announcement.priority]}
                              </span>
                              <p className="font-medium text-cjc-navy truncate">
                                {announcement.title}
                              </p>
                            </div>
                            <p className="text-xs text-warm-muted line-clamp-1 mt-1">
                              {announcement.content}
                            </p>
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
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${scope.color}`}
                          >
                            <ScopeIcon className="w-3 h-3" />
                            {scope.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={announcement.posted_by?.avatar_url || undefined}
                              name={getPostedByName(announcement)}
                              size="sm"
                            />
                            <div>
                              <p className="text-sm text-cjc-navy font-medium">
                                {getPostedByName(announcement)}
                              </p>
                              <p className="text-xs text-warm-muted">
                                {announcement.posted_by?.email}
                              </p>
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
                            <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-warm-muted">
                            {formatDate(announcement.created_at)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
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
        {!isLoading && filteredAnnouncements.length === 0 && (
          <div className="card p-12 text-center">
            <Megaphone className="w-12 h-12 text-warm-muted mx-auto mb-3" />
            <p className="text-warm-muted">
              {searchQuery || filterType !== "all"
                ? "No announcements found matching your criteria"
                : "No announcements yet. Create your first announcement to get started."}
            </p>
            {!searchQuery && filterType === "all" && (
              <button
                onClick={handleAddAnnouncement}
                className="btn btn-gold mt-4"
              >
                <Plus className="w-4 h-4" />
                New Announcement
              </button>
            )}
          </div>
        )}
      </div>

      {/* Announcement Form Modal */}
      <AnnouncementFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchAnnouncements}
        mode={formMode}
        announcement={selectedAnnouncement}
        currentUser={currentUser}
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
