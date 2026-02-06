"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  UserCheck,
  UserX,
  RefreshCw,
  Filter,
} from "lucide-react";
import {
  ClubWithAdviser,
  getAllClubs,
  deleteClub,
} from "@/lib/supabase";
import { ClubFormModal } from "@/components/features/ClubFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";

type ClubTypeFilter = "all" | "academic" | "non-academic";

export default function AdminClubsPage() {
  const { showToast } = useToast();
  const [clubs, setClubs] = useState<ClubWithAdviser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ClubTypeFilter>("all");

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedClub, setSelectedClub] = useState<ClubWithAdviser | undefined>(
    undefined
  );

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState<ClubWithAdviser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch clubs
  const fetchClubs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllClubs();
      setClubs(data);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      showToast("error", "Error", "Failed to load clubs");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  // Filter clubs by search query and type
  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.adviser?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.adviser?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || club.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Statistics
  const stats = {
    total: clubs.length,
    academic: clubs.filter((c) => c.type === "academic").length,
    nonAcademic: clubs.filter((c) => c.type === "non-academic").length,
    linked: clubs.filter((c) => c.adviser_id).length,
  };

  // Handle add club
  const handleAddClub = () => {
    setFormMode("add");
    setSelectedClub(undefined);
    setIsFormModalOpen(true);
  };

  // Handle edit club
  const handleEditClub = (club: ClubWithAdviser) => {
    setFormMode("edit");
    setSelectedClub(club);
    setIsFormModalOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (club: ClubWithAdviser) => {
    setClubToDelete(club);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!clubToDelete) return;

    setIsDeleting(true);
    try {
      await deleteClub(clubToDelete.id);
      showToast(
        "success",
        "Club Deleted",
        `${clubToDelete.name} has been deleted.`
      );
      fetchClubs();
    } catch (error) {
      console.error("Error deleting club:", error);
      showToast("error", "Error", "Failed to delete club");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setClubToDelete(null);
    }
  };

  // Format adviser name
  const getAdviserDisplayName = (club: ClubWithAdviser) => {
    if (!club.adviser) return null;
    const { first_name, last_name } = club.adviser;
    return `${first_name} ${last_name}`;
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Manage student organizations</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">
            Clubs & Organizations
          </h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-navy">{stats.total}</p>
            <p className="text-sm text-warm-muted">Total Clubs</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.academic}</p>
            <p className="text-sm text-warm-muted">Academic</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-blue">{stats.nonAcademic}</p>
            <p className="text-sm text-warm-muted">Non-Academic</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-gold">{stats.linked}</p>
            <p className="text-sm text-warm-muted">Linked Advisers</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
            <input
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ClubTypeFilter)}
              className="h-10 pl-10 pr-8 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue appearance-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="academic">Academic</option>
              <option value="non-academic">Non-Academic</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchClubs}
              disabled={isLoading}
              className="btn btn-secondary"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button onClick={handleAddClub} className="btn btn-gold">
              <Plus className="w-4 h-4" />
              Add Club
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && clubs.length === 0 && (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 text-cjc-blue animate-spin mx-auto mb-3" />
            <p className="text-warm-muted">Loading clubs...</p>
          </div>
        )}

        {/* Clubs Table */}
        {!isLoading && filteredClubs.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-warm border-b border-border-warm">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                    Club
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                    Adviser
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cjc-navy">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {filteredClubs.map((club) => (
                  <tr
                    key={club.id}
                    className="hover:bg-surface-warm transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {club.logo_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={club.logo_url}
                              alt={`${club.name} logo`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              club.type === "academic"
                                ? "bg-success/10"
                                : "bg-cjc-blue/10"
                            }`}
                          >
                            {club.type === "academic" ? (
                              <BookOpen className="w-5 h-5 text-success" />
                            ) : (
                              <Users className="w-5 h-5 text-cjc-blue" />
                            )}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-cjc-navy">{club.name}</p>
                          {club.description && (
                            <p className="text-xs text-warm-muted line-clamp-1">
                              {club.description}
                            </p>
                          )}
                          {club.type === "academic" && club.department && (
                            <p className="text-xs text-warm-muted">
                              Dept: {club.department}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded font-mono ${
                          club.type === "academic"
                            ? "bg-success/10 text-success"
                            : "bg-cjc-blue/10 text-cjc-blue"
                        }`}
                      >
                        {club.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          club.type === "academic"
                            ? "bg-success/10 text-success"
                            : "bg-cjc-blue/10 text-cjc-blue"
                        }`}
                      >
                        {club.type === "academic" ? "Academic" : "Non-Academic"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {club.adviser ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={club.adviser.avatar_url || undefined}
                            name={getAdviserDisplayName(club) || ""}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm text-cjc-navy font-medium">
                              {getAdviserDisplayName(club)}
                            </p>
                            <p className="text-xs text-warm-muted">
                              {club.adviser.email}
                            </p>
                          </div>
                          <UserCheck className="w-4 h-4 text-success ml-1" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-warm-muted">
                          <UserX className="w-4 h-4" />
                          <span className="text-sm">Not assigned</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {club.status === "active" ? (
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClub(club)}
                          className="p-2 hover:bg-surface-warm rounded-lg transition-colors"
                          title="Edit club"
                        >
                          <Edit2 className="w-4 h-4 text-warm-muted" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(club)}
                          className="p-2 hover:bg-danger/10 rounded-lg transition-colors"
                          title="Delete club"
                        >
                          <Trash2 className="w-4 h-4 text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredClubs.length === 0 && (
          <div className="card p-12 text-center">
            <Users className="w-12 h-12 text-warm-muted mx-auto mb-3" />
            <p className="text-warm-muted">
              {searchQuery || typeFilter !== "all"
                ? "No clubs found matching your search"
                : "No clubs yet. Add your first club to get started."}
            </p>
            {!searchQuery && typeFilter === "all" && (
              <button onClick={handleAddClub} className="btn btn-gold mt-4">
                <Plus className="w-4 h-4" />
                Add Club
              </button>
            )}
          </div>
        )}
      </div>

      {/* Club Form Modal */}
      <ClubFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchClubs}
        mode={formMode}
        club={selectedClub}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setClubToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Club"
        message={`Are you sure you want to delete "${clubToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
