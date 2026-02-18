"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckSquare, Plus, Pencil, Trash2, X, Check, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import {
  getDepartmentByHeadId,
  getRequirementsBySource,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  replaceRequirementLinks,
  Requirement,
  Department,
} from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/lib/utils";

interface LinkEntry {
  url: string;
  label: string;
}

interface RequirementFormData {
  name: string;
  description: string;
  is_required: boolean;
  requires_upload: boolean;
  links: LinkEntry[];
}

const emptyForm: RequirementFormData = { name: "", description: "", is_required: true, requires_upload: false, links: [] };

export default function DepartmentRequirementsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [department, setDepartment] = useState<Department | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<RequirementFormData>(emptyForm);
  const [addNameError, setAddNameError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RequirementFormData>(emptyForm);
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Requirement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const dept = await getDepartmentByHeadId(profile.id);
      if (!dept) {
        setError("You are not assigned as a department head.");
        setIsLoading(false);
        return;
      }
      setDepartment(dept);
      const data = await getRequirementsBySource("department", dept.id);
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

  async function handleAdd() {
    if (!addForm.name.trim()) {
      setAddNameError("Requirement name is required");
      return;
    }
    if (!department) return;
    setAddNameError(null);
    setIsAdding(true);
    try {
      const nextOrder = requirements.length > 0
        ? Math.max(...requirements.map(r => r.order)) + 1
        : 0;
      const created = await createRequirement({
        source_type: "department",
        source_id: department.id,
        name: addForm.name.trim(),
        description: addForm.description.trim() || undefined,
        is_required: addForm.is_required,
        requires_upload: addForm.requires_upload,
        order: nextOrder,
      });
      // Save links to requirement_links table
      const validLinks = addForm.links.filter(l => l.url.trim());
      if (validLinks.length > 0) {
        await replaceRequirementLinks(created.id, validLinks.map((l, i) => ({ url: l.url.trim(), label: l.label.trim() || undefined, order: i })));
      }
      setRequirements(prev => [...prev, { ...created, links: validLinks.map((l, i) => ({ id: '', requirement_id: created.id, url: l.url.trim(), label: l.label.trim() || null, order: i, created_at: '' })) }]);
      setAddForm(emptyForm);
      setShowAddForm(false);
      showToast("success", "Requirement Added", `"${created.name}" has been added.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add requirement";
      showToast("error", "Error", msg);
    } finally {
      setIsAdding(false);
    }
  }

  function startEdit(req: Requirement) {
    setEditingId(req.id);
    setEditForm({
      name: req.name,
      description: req.description ?? "",
      is_required: req.is_required,
      requires_upload: req.requires_upload,
      links: (req.links ?? []).map(l => ({ url: l.url, label: l.label ?? "" })),
    });
    setEditNameError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm);
    setEditNameError(null);
  }

  async function handleSaveEdit(reqId: string) {
    if (!editForm.name.trim()) {
      setEditNameError("Requirement name is required");
      return;
    }
    setEditNameError(null);
    setIsSaving(true);
    try {
      const updated = await updateRequirement(reqId, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        is_required: editForm.is_required,
        requires_upload: editForm.requires_upload,
      });
      // Replace all links for this requirement
      const validLinks = editForm.links.filter(l => l.url.trim());
      await replaceRequirementLinks(reqId, validLinks.map((l, i) => ({ url: l.url.trim(), label: l.label.trim() || undefined, order: i })));
      const updatedWithLinks = { ...updated, links: validLinks.map((l, i) => ({ id: '', requirement_id: reqId, url: l.url.trim(), label: l.label.trim() || null, order: i, created_at: '' })) };
      setRequirements(prev => prev.map(r => r.id === reqId ? updatedWithLinks : r));
      setEditingId(null);
      showToast("success", "Requirement Updated", `"${updated.name}" has been updated.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update requirement";
      showToast("error", "Error", msg);
    } finally {
      setIsSaving(false);
    }
  }

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">Department</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">Requirements</h1>
          </div>
        </header>
        <div className="p-6 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-ccis-blue-primary/30 border-t-ccis-blue-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">Department</p>
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
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-warm-muted">{department?.name}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">Requirements</h1>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setAddForm(emptyForm);
              setAddNameError(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-ccis-blue-primary text-white rounded-lg hover:bg-ccis-blue transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Requirement
          </button>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {/* Add Form */}
        {showAddForm && (
          <div className="card p-5">
            <h3 className="font-semibold text-cjc-navy mb-4">New Requirement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cjc-navy mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-base"
                  placeholder="e.g., Submit course evaluation form"
                  autoFocus
                />
                {addNameError && (
                  <p className="mt-1 text-xs text-red-500">{addNameError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-cjc-navy mb-1.5">
                  Description <span className="text-warm-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={addForm.description}
                  onChange={e => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-base resize-none"
                  rows={2}
                  placeholder="Additional notes shown to students"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="add-is-required"
                  type="checkbox"
                  checked={addForm.is_required}
                  onChange={e => setAddForm(prev => ({ ...prev, is_required: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-ccis-blue-primary focus:ring-ccis-blue-primary"
                />
                <label htmlFor="add-is-required" className="text-sm font-medium text-cjc-navy">
                  Mark as required
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="add-requires-upload"
                  type="checkbox"
                  checked={addForm.requires_upload}
                  onChange={e => setAddForm(prev => ({ ...prev, requires_upload: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-ccis-blue-primary focus:ring-ccis-blue-primary"
                />
                <label htmlFor="add-requires-upload" className="text-sm font-medium text-cjc-navy">
                  Requires file upload
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-cjc-navy mb-1.5">
                  Links <span className="text-warm-muted font-normal">(optional)</span>
                </label>
                <div className="space-y-2">
                  {addForm.links.map((link, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                      <div className="flex items-center justify-between gap-2">
                        <input type="text" value={link.label}
                          onChange={e => setAddForm(prev => { const links = [...prev.links]; links[i] = { ...links[i], label: e.target.value }; return { ...prev, links }; })}
                          className="input-base flex-1 font-medium" placeholder="Link name (e.g. Open Evaluation Form)" />
                        <button type="button" onClick={() => setAddForm(prev => ({ ...prev, links: prev.links.filter((_, j) => j !== i) }))}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0" title="Remove link">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input type="url" value={link.url}
                        onChange={e => setAddForm(prev => { const links = [...prev.links]; links[i] = { ...links[i], url: e.target.value }; return { ...prev, links }; })}
                        className="input-base w-full text-sm text-gray-500" placeholder="https://example.com/form" />
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setAddForm(prev => ({ ...prev, links: [...prev.links, { url: "", label: "" }] }))}
                    className="flex items-center gap-1.5 text-xs text-ccis-blue-primary hover:text-ccis-blue font-medium transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    Add Link
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className="flex items-center gap-2 px-4 py-2 bg-ccis-blue-primary text-white rounded-lg hover:bg-ccis-blue transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isAdding ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Requirements Table */}
        <div className="card overflow-hidden">
          {requirements.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-ccis-blue-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-ccis-blue-primary" />
              </div>
              <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">No Requirements Yet</h2>
              <p className="text-warm-muted max-w-md mx-auto mb-4">
                Add requirements students must complete for department clearance.
              </p>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setAddForm(emptyForm);
                  setAddNameError(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-ccis-blue-primary text-white rounded-lg hover:bg-ccis-blue transition-colors text-sm font-medium mx-auto"
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
                    {editingId === req.id ? (
                      <>
                        <td className="px-4 py-3 text-warm-muted text-xs align-top pt-4">{index + 1}</td>
                        <td className="px-4 py-3" colSpan={5}>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              className="input-base text-sm h-9 w-full"
                              autoFocus
                            />
                            {editNameError && (
                              <p className="text-xs text-red-500">{editNameError}</p>
                            )}
                            <textarea
                              value={editForm.description}
                              onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                              className="input-base text-sm resize-none w-full"
                              rows={2}
                              placeholder="Description (optional)"
                            />
                            <div className="flex gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editForm.is_required}
                                  onChange={e => setEditForm(prev => ({ ...prev, is_required: e.target.checked }))}
                                  className="w-4 h-4 rounded border-gray-300 text-ccis-blue-primary focus:ring-ccis-blue-primary"
                                />
                                <span className="text-xs text-cjc-navy">Required</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer ml-4">
                                <input
                                  type="checkbox"
                                  checked={editForm.requires_upload}
                                  onChange={e => setEditForm(prev => ({ ...prev, requires_upload: e.target.checked }))}
                                  className="w-4 h-4 rounded border-gray-300 text-ccis-blue-primary focus:ring-ccis-blue-primary"
                                />
                                <span className="text-xs text-cjc-navy">Requires upload</span>
                              </label>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-cjc-navy">Links <span className="text-warm-muted font-normal">(optional)</span></p>
                              {editForm.links.map((link, i) => (
                                <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                                  <div className="flex items-center justify-between gap-2">
                                    <input type="text" value={link.label}
                                      onChange={e => setEditForm(prev => { const links = [...prev.links]; links[i] = { ...links[i], label: e.target.value }; return { ...prev, links }; })}
                                      className="input-base text-sm flex-1 font-medium" placeholder="Link name (e.g. Open Evaluation Form)" />
                                    <button type="button" onClick={() => setEditForm(prev => ({ ...prev, links: prev.links.filter((_, j) => j !== i) }))}
                                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <input type="url" value={link.url}
                                    onChange={e => setEditForm(prev => { const links = [...prev.links]; links[i] = { ...links[i], url: e.target.value }; return { ...prev, links }; })}
                                    className="input-base text-sm w-full text-gray-500" placeholder="https://example.com/form" />
                                </div>
                              ))}
                              <button type="button"
                                onClick={() => setEditForm(prev => ({ ...prev, links: [...prev.links, { url: "", label: "" }] }))}
                                className="flex items-center gap-1.5 text-xs text-ccis-blue-primary hover:text-ccis-blue font-medium transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                                Add Link
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top pt-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(req.id)}
                              disabled={isSaving}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Save"
                            >
                              {isSaving ? (
                                <div className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
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
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                  {link.label || "Link"}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-warm-muted text-xs">
                          {formatDate(req.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEdit(req)}
                              className="p-1.5 text-gray-500 hover:text-cjc-navy hover:bg-gray-100 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(req)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer summary */}
        {requirements.length > 0 && (
          <p className="text-xs text-warm-muted px-1">
            {activeCount} active requirement{activeCount !== 1 ? "s" : ""} · {optionalCount} optional
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
    </div>
  );
}
