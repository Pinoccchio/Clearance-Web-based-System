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
import {
  CsgDepartmentLguWithHead,
  getAllCsgDepartmentLgus,
  deleteCsgDepartmentLgu,
} from "@/lib/supabase";
import { CsgDepartmentLguFormModal } from "@/components/features/CsgDepartmentLguFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";

export default function AdminCsgDepartmentLgusPage() {
  const { showToast } = useToast();
  const [lgus, setLgus] = useState<CsgDepartmentLguWithHead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedLgu, setSelectedLgu] = useState<CsgDepartmentLguWithHead | undefined>(undefined);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [lguToDelete, setLguToDelete] = useState<CsgDepartmentLguWithHead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchLgus = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllCsgDepartmentLgus();
      setLgus(data);
    } catch (error) {
      console.error("Error fetching LGUs:", error);
      showToast("error", "Error", "Failed to load LGUs");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLgus();
  }, [fetchLgus]);

  const filteredLgus = lgus.filter(
    (lgu) =>
      lgu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lgu.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lgu.department_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lgu.head?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lgu.head?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: lgus.length,
    active: lgus.filter((d) => d.status === "active").length,
    inactive: lgus.filter((d) => d.status === "inactive").length,
    linked: lgus.filter((d) => d.head_id).length,
  };

  const handleAddLgu = () => {
    setFormMode("add");
    setSelectedLgu(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditLgu = (lgu: CsgDepartmentLguWithHead) => {
    setFormMode("edit");
    setSelectedLgu(lgu);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (lgu: CsgDepartmentLguWithHead) => {
    setLguToDelete(lgu);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!lguToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCsgDepartmentLgu(lguToDelete.id);
      showToast("success", "LGU Deleted", `${lguToDelete.name} has been deleted.`);
      fetchLgus();
    } catch (error) {
      console.error("Error deleting LGU:", error);
      showToast("error", "Error", "Failed to delete LGU");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setLguToDelete(null);
    }
  };

  const getHeadDisplayName = (lgu: CsgDepartmentLguWithHead) => {
    if (!lgu.head) return null;
    return `${lgu.head.first_name} ${lgu.head.last_name}`;
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Manage Local Government Units</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">LGU Management</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-navy">{stats.total}</p>
            <p className="text-sm text-warm-muted">Total LGUs</p>
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
            <input
              placeholder="Search LGUs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={fetchLgus} disabled={isLoading} className="btn btn-secondary" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleAddLgu} className="btn btn-cjc-red">
              <Plus className="w-4 h-4" />
              Add LGU
            </button>
          </div>
        </div>

        {isLoading && lgus.length === 0 && (
          <div className="card p-12 text-center">
            <Loader2 className="w-8 h-8 text-cjc-blue animate-spin mx-auto mb-3" />
            <p className="text-warm-muted">Loading LGUs...</p>
          </div>
        )}

        {!isLoading && filteredLgus.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-warm border-b border-border-warm">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">LGU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy hidden md:table-cell">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy hidden md:table-cell">Linked Account</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy hidden sm:table-cell">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-cjc-navy">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {filteredLgus.map((lgu) => (
                  <tr key={lgu.id} className="hover:bg-surface-warm transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {lgu.logo_url ? (
                          <button className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer focus:outline-none" onClick={() => setPreviewUrl(lgu.logo_url!)}>
                            <img src={lgu.logo_url} alt={`${lgu.name} logo`} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-cjc-red/10 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-cjc-red" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-cjc-navy truncate">{lgu.name}</p>
                          {lgu.description && <p className="text-xs text-warm-muted line-clamp-1">{lgu.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded bg-cjc-navy text-white font-mono whitespace-nowrap">{lgu.code}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-xs px-2 py-1 rounded bg-cjc-blue/10 text-cjc-blue font-mono">{lgu.department_code}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {lgu.head ? (
                        <div className="flex items-center gap-2">
                          <Avatar src={lgu.head.avatar_url || undefined} name={getHeadDisplayName(lgu) || ""} variant="primary" size="sm" className={lgu.head.avatar_url ? "cursor-pointer" : ""} onClick={() => lgu.head?.avatar_url && setPreviewUrl(lgu.head.avatar_url)} />
                          <div>
                            <p className="text-sm text-cjc-navy font-medium">{getHeadDisplayName(lgu)}</p>
                            <p className="text-xs text-warm-muted">{lgu.head.email}</p>
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
                      {lgu.status === "active" ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">Active</span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">Inactive</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEditLgu(lgu)} className="p-2 hover:bg-surface-warm rounded-lg transition-colors" title="Edit LGU">
                          <Edit2 className="w-4 h-4 text-warm-muted" />
                        </button>
                        <button onClick={() => handleDeleteClick(lgu)} className="p-2 hover:bg-danger/10 rounded-lg transition-colors" title="Delete LGU">
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

        {!isLoading && filteredLgus.length === 0 && (
          <div className="card p-12 text-center">
            <Shield className="w-12 h-12 text-warm-muted mx-auto mb-3" />
            <p className="text-warm-muted">
              {searchQuery ? "No LGUs found matching your search" : "No LGUs yet. Add your first LGU to get started."}
            </p>
            {!searchQuery && (
              <button onClick={handleAddLgu} className="btn btn-cjc-red mt-4">
                <Plus className="w-4 h-4" />
                Add LGU
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

      <CsgDepartmentLguFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchLgus}
        mode={formMode}
        lgu={selectedLgu}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => { setIsDeleteDialogOpen(false); setLguToDelete(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete LGU"
        message={`Are you sure you want to delete "${lguToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
