"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
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
import {
  CspsgDivisionWithHead,
  getAllCspsgDivisions,
  deleteCspsgDivision,
} from "@/lib/supabase";
import { CspsgDivisionFormModal } from "@/components/features/CspsgDivisionFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";

export default function AdminCspsgDivisionsPage() {
  const { showToast } = useToast();
  const [divisions, setDivisions] = useState<CspsgDivisionWithHead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedDivision, setSelectedDivision] = useState<CspsgDivisionWithHead | undefined>(undefined);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [divisionToDelete, setDivisionToDelete] = useState<CspsgDivisionWithHead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchDivisions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllCspsgDivisions();
      setDivisions(data);
    } catch (error) {
      console.error("Error fetching CSPSG Divisions:", error);
      showToast("error", "Error", "Failed to load CSPSG Divisions");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDivisions();
  }, [fetchDivisions]);

  const filteredDivisions = divisions.filter(
    (div) =>
      div.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      div.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      div.head?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      div.head?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: divisions.length,
    active: divisions.filter((d) => d.status === "active").length,
    inactive: divisions.filter((d) => d.status === "inactive").length,
    linked: divisions.filter((d) => d.head_id).length,
  };

  const handleAddDivision = () => { setFormMode("add"); setSelectedDivision(undefined); setIsFormModalOpen(true); };
  const handleEditDivision = (div: CspsgDivisionWithHead) => { setFormMode("edit"); setSelectedDivision(div); setIsFormModalOpen(true); };
  const handleDeleteClick = (div: CspsgDivisionWithHead) => { setDivisionToDelete(div); setIsDeleteDialogOpen(true); };

  const handleConfirmDelete = async () => {
    if (!divisionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCspsgDivision(divisionToDelete.id);
      showToast("success", "Division Deleted", `${divisionToDelete.name} has been deleted.`);
      fetchDivisions();
    } catch (error) {
      console.error("Error deleting division:", error);
      showToast("error", "Error", "Failed to delete division");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDivisionToDelete(null);
    }
  };

  const getHeadDisplayName = (div: CspsgDivisionWithHead) => {
    if (!div.head) return null;
    return `${div.head.first_name} ${div.head.last_name}`;
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Manage CSP Divisions</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">CSP Division Management</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-navy">{stats.total}</p>
            <p className="text-sm text-warm-muted">Total Divisions</p>
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

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
            <input placeholder="Search divisions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue" />
          </div>
          <div className="flex gap-2">
            <button onClick={fetchDivisions} disabled={isLoading} className="btn btn-secondary" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleAddDivision} className="btn btn-cjc-red">
              <Plus className="w-4 h-4" />
              Add Division
            </button>
          </div>
        </div>

        {isLoading && divisions.length === 0 && (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 text-cjc-blue animate-spin mx-auto mb-3" />
            <p className="text-warm-muted">Loading divisions...</p>
          </div>
        )}

        {!isLoading && filteredDivisions.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-warm border-b border-border-warm">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Division</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy hidden md:table-cell">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy hidden md:table-cell">Linked Account</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy hidden sm:table-cell">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cjc-navy">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {filteredDivisions.map((div) => (
                  <tr key={div.id} className="hover:bg-surface-warm transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {div.logo_url ? (
                          <button className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer focus:outline-none" onClick={() => setPreviewUrl(div.logo_url!)}>
                            <img src={div.logo_url} alt={`${div.name} logo`} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-cjc-red/10 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-cjc-red" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-cjc-navy truncate">{div.name}</p>
                          {div.description && <p className="text-xs text-warm-muted line-clamp-1">{div.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded bg-cjc-navy text-white font-mono whitespace-nowrap">{div.code}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-xs px-2 py-1 rounded bg-cjc-blue/10 text-cjc-blue font-mono">{div.department_code}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {div.head ? (
                        <div className="flex items-center gap-2">
                          <Avatar src={div.head.avatar_url || undefined} name={getHeadDisplayName(div) || ""} variant="primary" size="sm" />
                          <div>
                            <p className="text-sm text-cjc-navy font-medium">{getHeadDisplayName(div)}</p>
                            <p className="text-xs text-warm-muted">{div.head.email}</p>
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
                    <td className="py-3 px-4 hidden sm:table-cell">
                      {div.status === "active" ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">Active</span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">Inactive</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEditDivision(div)} className="p-2 hover:bg-surface-warm rounded-lg transition-colors" title="Edit division">
                          <Edit2 className="w-4 h-4 text-warm-muted" />
                        </button>
                        <button onClick={() => handleDeleteClick(div)} className="p-2 hover:bg-danger/10 rounded-lg transition-colors" title="Delete division">
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

        {!isLoading && filteredDivisions.length === 0 && (
          <div className="card p-12 text-center">
            <GraduationCap className="w-12 h-12 text-warm-muted mx-auto mb-3" />
            <p className="text-warm-muted">
              {searchQuery ? "No divisions found matching your search" : "No divisions yet. Add your first division to get started."}
            </p>
            {!searchQuery && (
              <button onClick={handleAddDivision} className="btn btn-cjc-red mt-4">
                <Plus className="w-4 h-4" />
                Add Division
              </button>
            )}
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt="Preview" className="w-full rounded-xl object-cover shadow-2xl" />
            <button className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-gray-700 hover:bg-white" onClick={() => setPreviewUrl(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <CspsgDivisionFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchDivisions}
        mode={formMode}
        division={selectedDivision}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => { setIsDeleteDialogOpen(false); setDivisionToDelete(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete Division"
        message={`Are you sure you want to delete "${divisionToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
