"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  UserCheck,
  UserX,
  RefreshCw,
  X,
} from "lucide-react";
import { CsgWithHead, getAllCsg, deleteCsg } from "@/lib/supabase";
import { CsgFormModal } from "@/components/features/CsgFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";

export default function AdminCsgPage() {
  const { showToast } = useToast();
  const [csgs, setCsgs] = useState<CsgWithHead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedCsg, setSelectedCsg] = useState<CsgWithHead | undefined>(undefined);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [csgToDelete, setCsgToDelete] = useState<CsgWithHead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchCsgs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllCsg();
      setCsgs(data);
    } catch (error) {
      console.error("Error fetching CSG entries:", error);
      showToast("error", "Error", "Failed to load CSG entries");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCsgs();
  }, [fetchCsgs]);

  const filteredCsgs = csgs.filter(
    (csg) =>
      csg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      csg.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      csg.head?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      csg.head?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: csgs.length,
    active: csgs.filter((c) => c.status === "active").length,
    inactive: csgs.filter((c) => c.status === "inactive").length,
    linked: csgs.filter((c) => c.head_id).length,
  };

  const handleAddCsg = () => {
    setFormMode("add");
    setSelectedCsg(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditCsg = (csg: CsgWithHead) => {
    setFormMode("edit");
    setSelectedCsg(csg);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (csg: CsgWithHead) => {
    setCsgToDelete(csg);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!csgToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCsg(csgToDelete.id);
      showToast("success", "CSG Deleted", `${csgToDelete.name} has been deleted.`);
      fetchCsgs();
    } catch (error) {
      console.error("Error deleting CSG:", error);
      showToast("error", "Error", "Failed to delete CSG entry");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setCsgToDelete(null);
    }
  };

  const getHeadDisplayName = (csg: CsgWithHead) => {
    if (!csg.head) return null;
    return `${csg.head.first_name} ${csg.head.last_name}`;
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Manage Central Student Government</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">CSG Management</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-navy">{stats.total}</p>
            <p className="text-sm text-warm-muted">Total CSG</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.active}</p>
            <p className="text-sm text-warm-muted">Active</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-warm-muted">{stats.inactive}</p>
            <p className="text-sm text-warm-muted">Inactive</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-blue">{stats.linked}</p>
            <p className="text-sm text-warm-muted">Linked Accounts</p>
          </div>
        </div>

        {/* Search + Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
            <input
              placeholder="Search by name, code, or head name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchCsgs}
              disabled={isLoading}
              className="btn btn-secondary"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleAddCsg} className="btn btn-cjc-red">
              <Plus className="w-4 h-4" />
              Add CSG
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && csgs.length === 0 && (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 text-cjc-blue animate-spin mx-auto mb-3" />
            <p className="text-warm-muted">Loading CSG entries...</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && filteredCsgs.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-warm border-b border-border-warm">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy hidden md:table-cell">
                    Linked Account
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cjc-navy">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {filteredCsgs.map((csg) => (
                  <tr key={csg.id} className="hover:bg-surface-warm transition-colors">
                    {/* Name + Logo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {csg.logo_url ? (
                          <button
                            className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer focus:outline-none"
                            onClick={() => setPreviewUrl(csg.logo_url!)}
                          >
                            <img
                              src={csg.logo_url}
                              alt={`${csg.name} logo`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-cjc-red/10 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-cjc-red" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-cjc-navy truncate">{csg.name}</p>
                          {csg.description && (
                            <p className="text-xs text-warm-muted line-clamp-1">{csg.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded bg-cjc-navy text-white font-mono whitespace-nowrap">
                        {csg.code}
                      </span>
                    </td>

                    {/* Linked Account */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      {csg.head ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={csg.head.avatar_url || undefined}
                            name={getHeadDisplayName(csg) || ""}
                            variant="primary"
                            size="sm"
                            className={csg.head.avatar_url ? "cursor-pointer" : ""}
                            onClick={() =>
                              csg.head?.avatar_url && setPreviewUrl(csg.head.avatar_url)
                            }
                          />
                          <div>
                            <p className="text-sm text-cjc-navy font-medium">
                              {getHeadDisplayName(csg)}
                            </p>
                            <p className="text-xs text-warm-muted">{csg.head.email}</p>
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

                    {/* Status */}
                    <td className="py-3 px-4 hidden sm:table-cell">
                      {csg.status === "active" ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditCsg(csg)}
                          className="p-2 hover:bg-surface-warm rounded-lg transition-colors"
                          title="Edit CSG"
                        >
                          <Edit2 className="w-4 h-4 text-warm-muted" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(csg)}
                          className="p-2 hover:bg-danger/10 rounded-lg transition-colors"
                          title="Delete CSG"
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

        {/* Empty state */}
        {!isLoading && filteredCsgs.length === 0 && (
          <div className="card p-12 text-center">
            <Shield className="w-12 h-12 text-warm-muted mx-auto mb-3" />
            <p className="text-warm-muted">
              {searchQuery
                ? "No CSG entries found matching your search"
                : "No CSG entries yet. Add your first CSG to get started."}
            </p>
            {!searchQuery && (
              <button onClick={handleAddCsg} className="btn btn-cjc-red mt-4">
                <Plus className="w-4 h-4" />
                Add CSG
              </button>
            )}
          </div>
        )}
      </div>

      {/* Logo / Avatar preview overlay */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full rounded-xl object-cover shadow-2xl"
            />
            <button
              className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-gray-700 hover:bg-white"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <CsgFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchCsgs}
        mode={formMode}
        csg={selectedCsg}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setCsgToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete CSG"
        message={`Are you sure you want to delete "${csgToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
