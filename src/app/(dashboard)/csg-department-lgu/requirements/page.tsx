"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckSquare, Plus, Pencil, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { RequirementFormModal } from "@/components/features/RequirementFormModal";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import {
  getCsgDepartmentLguByHeadId,
  getRequirementsBySource,
  updateRequirement,
  deleteRequirement,
  Requirement,
  CsgDepartmentLgu,
} from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/lib/utils";

export default function CsgDepartmentLguRequirementsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [lgu, setLgu] = useState<CsgDepartmentLgu | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit state
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Requirement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Publish state
  const [togglingPublish, setTogglingPublish] = useState<Set<string>>(new Set());
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const lguData = await getCsgDepartmentLguByHeadId(profile.id);
      if (!lguData) {
        setError("You are not assigned as a LGU head.");
        setIsLoading(false);
        return;
      }
      setLgu(lguData);
      const data = await getRequirementsBySource("csg_department_lgu", lguData.id);
      setRequirements(data);
    } catch {
      setError("Failed to load requirements.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtimeRefresh('requirements', loadData);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRequirement(deleteTarget.id);
      setRequirements(prev => prev.filter(r => r.id !== deleteTarget.id));
      showToast("success", "Requirement Deleted", `"${deleteTarget.name}" has been deleted.`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete requirement";
      showToast("error", "Error", msg);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleTogglePublish(req: Requirement) {
    setTogglingPublish(prev => new Set(prev).add(req.id));
    try {
      const updated = await updateRequirement(req.id, { is_published: !req.is_published });
      setRequirements(prev => prev.map(r => r.id === req.id ? { ...r, is_published: updated.is_published } : r));
      showToast("success",
        updated.is_published ? "Requirement Published" : "Requirement Unpublished",
        `"${req.name}" is now ${updated.is_published ? "live and visible to students" : "in draft mode"}.`
      );
    } catch (err: unknown) {
      showToast("error", "Error", err instanceof Error ? err.message : "Failed to update");
    } finally {
      setTogglingPublish(prev => { const n = new Set(prev); n.delete(req.id); return n; });
    }
  }

  async function handleBulkPublish() {
    const drafts = requirements.filter(r => !r.is_published);
    if (drafts.length === 0) return;
    setIsBulkPublishing(true);
    try {
      await Promise.all(drafts.map(r => updateRequirement(r.id, { is_published: true })));
      setRequirements(prev => prev.map(r => ({ ...r, is_published: true })));
      showToast("success", "All Published", `${drafts.length} requirement${drafts.length !== 1 ? "s" : ""} are now live.`);
    } catch (err: unknown) {
      showToast("error", "Error", err instanceof Error ? err.message : "Failed to bulk publish");
    } finally {
      setIsBulkPublishing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">LGU</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">Requirements</h1>
          </div>
        </header>
        <div className="p-6 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cjc-red/30 border-t-cjc-red rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">LGU</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">Requirements</h1>
          </div>
        </header>
        <div className="p-6">
          <div className="card p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const activeCount = requirements.filter(r => r.is_required).length;
  const optionalCount = requirements.filter(r => !r.is_required).length;

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-warm-muted">{lgu?.name}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">Requirements</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {requirements.some(r => !r.is_published) && (
              <button onClick={handleBulkPublish} disabled={isBulkPublishing}
                className="flex items-center gap-2 px-4 py-2 border border-cjc-red text-cjc-red rounded-lg hover:bg-cjc-red-light-primary/5 transition-colors text-sm font-medium disabled:opacity-50">
                {isBulkPublishing
                  ? <div className="w-4 h-4 border-2 border-cjc-red/30 border-t-cjc-red rounded-full animate-spin" />
                  : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline">Publish All</span>
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cjc-red text-white rounded-lg hover:bg-cjc-red-light transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Requirement</span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Requirements Table */}
        <div className="card overflow-hidden">
          {requirements.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-cjc-red/10 flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-cjc-red" />
              </div>
              <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">No Requirements Yet</h2>
              <p className="text-warm-muted max-w-md mx-auto mb-4">
                Add requirements students must complete for LGU clearance.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cjc-red text-white rounded-lg hover:bg-cjc-red-light transition-colors text-sm font-medium mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Requirement
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border-warm">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider">
                    Requirement
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider w-28">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider w-28">
                    Upload
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider w-28">Link</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider w-24">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider w-28">
                    Added
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-warm-muted uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {requirements.map((req, index) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 text-warm-muted text-xs">{index + 1}</td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-cjc-navy">{req.name}</p>
                          {req.description && (
                            <p className="text-xs text-warm-muted mt-0.5">{req.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {req.is_required ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {req.requires_upload ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cjc-blue/10 text-cjc-navy">
                              Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              None
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {(req.links ?? []).length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {(req.links ?? []).map(link => (
                                <a key={link.id || link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cjc-blue/10 text-cjc-navy hover:bg-cjc-blue/15 transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                  {link.label || "Link"}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {req.is_published ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <Eye className="w-3 h-3" />Live
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                <EyeOff className="w-3 h-3" />Draft
                              </span>
                            )}
                            <button
                              onClick={() => handleTogglePublish(req)}
                              disabled={togglingPublish.has(req.id)}
                              title={req.is_published ? "Unpublish" : "Publish"}
                              className={`p-1.5 rounded-md transition-colors ${req.is_published ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                            >
                              {togglingPublish.has(req.id)
                                ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                : req.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-warm-muted text-xs">
                          {formatDate(req.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingRequirement(req)}
                              className="p-2 hover:bg-surface-warm rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4 text-warm-muted" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(req)}
                              className="p-2 hover:bg-danger/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-danger" />
                            </button>
                          </div>
                        </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer summary */}
        {requirements.length > 0 && (
          <p className="text-xs text-warm-muted px-1">
            {requirements.filter(r => r.is_published).length} live ·{" "}
            {requirements.filter(r => !r.is_published).length} draft ·{" "}
            {activeCount} required · {optionalCount} optional
          </p>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Requirement"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Add Requirement Modal */}
      {lgu && (
        <RequirementFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            loadData();
          }}
          sourceType="csg_department_lgu"
          sourceId={lgu.id}
          existingRequirements={requirements}
        />
      )}

      {/* Edit Requirement Modal */}
      {lgu && (
        <RequirementFormModal
          isOpen={!!editingRequirement}
          onClose={() => setEditingRequirement(null)}
          onSuccess={() => {
            setEditingRequirement(null);
            loadData();
          }}
          sourceType="csg_department_lgu"
          sourceId={lgu.id}
          existingRequirements={requirements}
          mode="edit"
          requirement={editingRequirement ?? undefined}
        />
      )}
    </div>
  );
}
