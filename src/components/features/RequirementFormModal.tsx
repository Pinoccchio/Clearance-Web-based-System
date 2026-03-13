"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/Button";
import { CheckSquare, Plus, X, ScanLine } from "lucide-react";
import {
  createRequirement,
  replaceRequirementLinks,
  Requirement,
} from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";

interface LinkEntry {
  url: string;
  label: string;
}

interface RequirementFormData {
  name: string;
  description: string;
  is_required: boolean;
  requires_upload: boolean;
  is_attendance: boolean;
  links: LinkEntry[];
}

const emptyForm: RequirementFormData = {
  name: "",
  description: "",
  is_required: true,
  requires_upload: false,
  is_attendance: false,
  links: [],
};

interface RequirementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sourceType: "department" | "office" | "club";
  sourceId: string;
  existingRequirements: Requirement[];
}

export function RequirementFormModal({
  isOpen,
  onClose,
  onSuccess,
  sourceType,
  sourceId,
  existingRequirements,
}: RequirementFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<RequirementFormData>(emptyForm);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(emptyForm);
      setNameError(null);
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      setNameError("Requirement name is required");
      return;
    }

    setNameError(null);
    setIsLoading(true);

    try {
      const nextOrder =
        existingRequirements.length > 0
          ? Math.max(...existingRequirements.map((r) => r.order ?? 0)) + 1
          : 0;

      const created = await createRequirement({
        source_type: sourceType,
        source_id: sourceId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_required: formData.is_required,
        requires_upload: formData.requires_upload,
        is_attendance: formData.is_attendance,
        order: nextOrder,
      });

      // Save links to requirement_links table
      const validLinks = formData.links.filter((l) => l.url.trim());
      if (validLinks.length > 0) {
        await replaceRequirementLinks(
          created.id,
          validLinks.map((l, i) => ({
            url: l.url.trim(),
            label: l.label.trim() || undefined,
            order: i,
          }))
        );
      }

      showToast(
        "success",
        "Requirement Added",
        `"${created.name}" has been added.`
      );
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to add requirement";
      showToast("error", "Error", msg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddLink() {
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, { url: "", label: "" }],
    }));
  }

  function handleRemoveLink(index: number) {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  }

  function handleLinkChange(
    index: number,
    field: "url" | "label",
    value: string
  ) {
    setFormData((prev) => {
      const links = [...prev.links];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, links };
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-cjc-red/10 flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-cjc-red" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cjc-navy">
              New Requirement
            </h2>
            <p className="text-sm text-gray-500">
              Add a new clearance requirement
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-cjc-navy mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="input-base"
              placeholder="e.g., Submit clearance form"
              autoFocus
            />
            {nameError && (
              <p className="mt-1 text-xs text-red-500">{nameError}</p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-cjc-navy mb-1.5">
              Description{" "}
              <span className="text-warm-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="input-base resize-none"
              rows={2}
              placeholder="Additional notes shown to students/members"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                id="modal-is-required"
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_required: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded border-gray-300 text-cjc-blue focus:ring-cjc-blue"
              />
              <label
                htmlFor="modal-is-required"
                className="text-sm font-medium text-cjc-navy"
              >
                Mark as required
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="modal-requires-upload"
                type="checkbox"
                checked={formData.requires_upload}
                disabled={formData.is_attendance}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    requires_upload: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded border-gray-300 text-cjc-blue focus:ring-cjc-blue disabled:opacity-40"
              />
              <label
                htmlFor="modal-requires-upload"
                className={`text-sm font-medium ${formData.is_attendance ? "text-gray-400" : "text-cjc-navy"}`}
              >
                Requires file upload
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="modal-is-attendance"
                type="checkbox"
                checked={formData.is_attendance}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_attendance: e.target.checked,
                    requires_upload: e.target.checked ? false : prev.requires_upload,
                  }))
                }
                className="w-4 h-4 rounded border-gray-300 text-cjc-blue focus:ring-cjc-blue"
              />
              <label
                htmlFor="modal-is-attendance"
                className="text-sm font-medium text-cjc-navy flex items-center gap-1.5"
              >
                <ScanLine className="w-3.5 h-3.5 text-indigo-500" />
                Fulfilled via attendance scan only
              </label>
            </div>
          </div>
          {formData.is_attendance && (
            <div className="flex items-start gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
              <ScanLine className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700">
                Students cannot manually submit this. Office staff must scan them at an attendance event.
              </p>
            </div>
          )}

          {/* Links Section */}
          <div>
            <label className="block text-sm font-medium text-cjc-navy mb-1.5">
              Links{" "}
              <span className="text-warm-muted font-normal">(optional)</span>
            </label>
            <div className="space-y-2">
              {formData.links.map((link, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) =>
                        handleLinkChange(i, "label", e.target.value)
                      }
                      className="input-base flex-1 font-medium"
                      placeholder="Link name (e.g. Payment Form)"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      title="Remove link"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleLinkChange(i, "url", e.target.value)}
                    className="input-base w-full text-sm text-gray-500"
                    placeholder="https://example.com/form"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddLink}
                className="flex items-center gap-1.5 text-xs text-cjc-blue hover:text-cjc-blue/80 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Link
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              className="flex-1"
              isLoading={isLoading}
            >
              Add Requirement
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
