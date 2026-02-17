"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  ClearanceRequest,
  ClearanceItem,
  Requirement,
  SystemSettings,
  SubmissionWithRequirement,
  createClearanceRequest,
  getClearanceItemForRequest,
  upsertRequirementSubmission,
  submitClearanceItem,
  batchAcknowledgeRequirements,
  acknowledgeRequirement,
} from "@/lib/supabase";
import { uploadSubmissionFile, validateSubmissionFile, deleteSubmissionFile } from "@/lib/storage";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Loader2,
  Eye,
  RefreshCw,
  Trash2,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import ClearanceItemHistoryTimeline from "@/components/shared/ClearanceItemHistoryTimeline";

type ClearanceType = "semester" | "graduation" | "transfer";

const CLEARANCE_TYPE_LABELS: Record<ClearanceType, string> = {
  semester: "Semester Clearance",
  graduation: "Graduation Clearance",
  transfer: "Transfer Clearance",
};

interface Source {
  id: string;
  name: string;
  code: string;
}

interface Props {
  sourceType: "department" | "office" | "club";
  sources: Source[];
  studentId: string;
  systemSettings: SystemSettings | null;
  requirementsBySource: Record<string, Requirement[]>;
  clearanceRequest: ClearanceRequest | null;
  clearanceItems: ClearanceItem[];
  submissionsByItem: Record<string, SubmissionWithRequirement[]>;
  onRequestCreated: (req: ClearanceRequest) => void;
  onUploadComplete?: () => void;
  loading: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function SubmitView({
  sourceType,
  sources,
  studentId,
  systemSettings,
  requirementsBySource,
  clearanceRequest,
  clearanceItems,
  submissionsByItem,
  onRequestCreated,
  onUploadComplete,
  loading,
}: Props) {
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState<ClearanceType>("semester");
  const [isStarting, setIsStarting] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(
      sources
        .filter((s) => {
          const item = clearanceItems.find(
            (i) => i.source_type === sourceType && i.source_id === s.id
          );
          // Expand if student needs to act: no item yet, or rejected/on_hold
          return !item || item.status === 'pending' || item.status === 'rejected' || item.status === 'on_hold';
        })
        .map((s) => s.id)
    )
  );
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [uploadingReqs, setUploadingReqs] = useState<Set<string>>(new Set());
  const [deletingReqs, setDeletingReqs] = useState<Set<string>>(new Set());
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  // Optimistic local overrides: reqId → updated sub (or null = deleted)
  const [localSubOverrides, setLocalSubOverrides] = useState<Record<string, SubmissionWithRequirement | null>>({});
  const [submittingSource, setSubmittingSource] = useState<string | null>(null);
  const [submittedSources, setSubmittedSources] = useState<Set<string>>(new Set());
  const [togglingReqs, setTogglingReqs] = useState<Set<string>>(new Set());
  const [pendingSubmit, setPendingSubmit] = useState<{ sourceId: string; item: ClearanceItem } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ reqId: string; clearanceItemId: string; fileUrl: string } | null>(null);
  const [historyItem, setHistoryItem] = useState<{ item: ClearanceItem; sourceName: string } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Clear optimistic overrides once parent re-syncs the prop
  useEffect(() => {
    setLocalSubOverrides({});
  }, [submissionsByItem]);

  const allowedTypes: ClearanceType[] = systemSettings
    ? [
        ...(systemSettings.allow_semester_clearance ? (["semester"] as ClearanceType[]) : []),
        ...(systemSettings.allow_transfer_clearance ? (["transfer"] as ClearanceType[]) : []),
        ...(systemSettings.allow_graduation_clearance ? (["graduation"] as ClearanceType[]) : []),
      ]
    : [];

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleStartClearance() {
    if (!systemSettings || allowedTypes.length === 0) return;
    setIsStarting(true);
    try {
      const req = await createClearanceRequest({
        student_id: studentId,
        type: selectedType,
        academic_year: systemSettings.academic_year,
        semester: systemSettings.current_semester,
      });
      // Wait for DB trigger to create clearance_items
      await new Promise((resolve) => setTimeout(resolve, 800));
      onRequestCreated(req);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start clearance.";
      showToast("error", "Failed to start clearance", msg);
    } finally {
      setIsStarting(false);
    }
  }

  async function handleFileUpload(reqId: string, clearanceItemId: string, file: File) {
    const validation = validateSubmissionFile(file);
    if (!validation.valid) {
      setFileErrors((prev) => ({ ...prev, [reqId]: validation.error! }));
      return;
    }
    setFileErrors((prev) => { const n = { ...prev }; delete n[reqId]; return n; });
    setUploadingReqs((prev) => new Set(prev).add(reqId));
    try {
      const url = await uploadSubmissionFile(file, studentId, reqId);
      const upserted = await upsertRequirementSubmission({
        clearance_item_id: clearanceItemId,
        requirement_id: reqId,
        student_id: studentId,
        file_url: url,
      });
      // Optimistic update — show submitted chip immediately, no flicker
      setLocalSubOverrides((prev) => ({
        ...prev,
        [reqId]: { ...upserted, requirement: { id: reqId } as SubmissionWithRequirement["requirement"] },
      }));
      showToast("success", "File uploaded", "Your file has been submitted.");
      onUploadComplete?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      showToast("error", "Upload failed", msg);
    } finally {
      setUploadingReqs((prev) => { const n = new Set(prev); n.delete(reqId); return n; });
    }
  }

  function handleFileSelect(reqId: string, clearanceItemId: string, file: File | null) {
    if (!file) return;
    handleFileUpload(reqId, clearanceItemId, file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(reqId: string, clearanceItemId: string, e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(reqId, clearanceItemId, file);
  }

  async function handleDeleteFile(reqId: string, clearanceItemId: string, fileUrl: string) {
    setDeletingReqs((prev) => new Set(prev).add(reqId));
    try {
      await deleteSubmissionFile(fileUrl);
      await upsertRequirementSubmission({
        clearance_item_id: clearanceItemId,
        requirement_id: reqId,
        student_id: studentId,
        file_url: null,
      });
      // Optimistic update — show upload zone immediately, no flicker
      setLocalSubOverrides((prev) => ({ ...prev, [reqId]: null }));
      showToast("success", "File removed", "Your submission file has been removed.");
      onUploadComplete?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove file";
      showToast("error", "Remove failed", msg);
    } finally {
      setDeletingReqs((prev) => { const n = new Set(prev); n.delete(reqId); return n; });
    }
  }

  async function handleCheckboxToggle(reqId: string, clearanceItemId: string, currentlyChecked: boolean) {
    setTogglingReqs((prev) => new Set(prev).add(reqId));
    try {
      await acknowledgeRequirement({
        clearance_item_id: clearanceItemId,
        requirement_id: reqId,
        student_id: studentId,
        acknowledged: !currentlyChecked,
      });
      // Optimistic update
      setLocalSubOverrides((prev) => ({
        ...prev,
        [reqId]: !currentlyChecked
          ? {
              id: reqId,
              clearance_item_id: clearanceItemId,
              requirement_id: reqId,
              student_id: studentId,
              file_url: null,
              status: 'submitted' as const,
              remarks: null,
              submitted_at: new Date().toISOString(),
              reviewed_at: null,
              requirement: { id: reqId } as SubmissionWithRequirement["requirement"],
            }
          : null,
      }));
      onUploadComplete?.();
    } catch (err) {
      showToast("error", "Failed to save", err instanceof Error ? err.message : "Could not save your response.");
    } finally {
      setTogglingReqs((prev) => { const n = new Set(prev); n.delete(reqId); return n; });
    }
  }

  async function handleSubmitForReview(sourceId: string, item: ClearanceItem) {
    setSubmittingSource(sourceId);
    try {
      await submitClearanceItem(item.id, studentId, item.status);
      setSubmittedSources((prev) => new Set(prev).add(sourceId));
      showToast("success", "Submitted for review", "Your submission is now in the review queue.");
      onUploadComplete?.();
    } catch (err) {
      showToast("error", "Submit failed", err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSubmittingSource(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Phase 1: No active request — show "Start Clearance" card
  if (!clearanceRequest) {
    if (!systemSettings || allowedTypes.length === 0) {
      return (
        <Card padding="lg" className="text-center max-w-sm mx-auto">
          <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-cjc-navy mb-1">Submissions Closed</h3>
          <p className="text-sm text-gray-500">
            Clearance submissions are not currently open. Check back later.
          </p>
        </Card>
      );
    }

    return (
      <Card padding="lg" className="max-w-lg mx-auto space-y-5">
        <div>
          <h3 className="text-base font-semibold text-cjc-navy mb-1">Start Your Clearance</h3>
          <p className="text-sm text-gray-500">
            Starting clearance will initialize your submission with all departments, offices, and enrolled clubs at once.
          </p>
        </div>

        {/* Clearance type selector */}
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Clearance Type</p>
          <div className="flex flex-wrap gap-2">
            {allowedTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  selectedType === type
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    selectedType === type ? "border-blue-600 bg-blue-600" : "border-gray-300"
                  }`}
                />
                {CLEARANCE_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Academic period */}
        <div className="flex gap-6 text-sm text-gray-600">
          <div>
            <span className="font-medium text-gray-700">Academic Year:</span>{" "}
            {systemSettings.academic_year}
          </div>
          <div>
            <span className="font-medium text-gray-700">Semester:</span>{" "}
            {systemSettings.current_semester}
          </div>
        </div>

        <Button
          variant="gold"
          size="md"
          disabled={isStarting}
          isLoading={isStarting}
          onClick={handleStartClearance}
        >
          {isStarting ? "Starting..." : "Start Clearance"}
        </Button>
      </Card>
    );
  }

  // Phase 2: Request exists — show accordion per source
  if (sources.length === 0) {
    return (
      <Card padding="lg" className="text-center max-w-sm mx-auto">
        <Info className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No sources found for this section.</p>
      </Card>
    );
  }

  return (
    <>
    {/* Lightbox */}
    {lightboxUrl && (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
        onClick={() => setLightboxUrl(null)}
      >
        <button
          type="button"
          onClick={() => setLightboxUrl(null)}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <a
          href={lightboxUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Open original
        </a>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lightboxUrl}
          alt="Submission preview"
          className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Upload a file for requirements marked with &ldquo;Upload Required&rdquo;. Other requirements need no file.
        </p>
      </div>

      {sources.map((source) => {
        const reqs = requirementsBySource[source.id] ?? [];
        const item = clearanceItems.find(
          (i) => i.source_type === sourceType && i.source_id === source.id
        );
        const isOpen = openSections.has(source.id);

        // Determine item status badge
        let badgeVariant: "default" | "warning" | "success" | "danger" | "onHold" | "neutral" = "default";
        let badgeLabel = "Not Started";
        if (reqs.length === 0) { badgeVariant = "neutral"; badgeLabel = "No Requirements"; }
        else if (item?.status === "pending") { badgeVariant = "neutral"; badgeLabel = "Not Submitted"; }
        else if (item?.status === "submitted") { badgeVariant = "warning"; badgeLabel = "Pending Review"; }
        else if (item?.status === "approved") { badgeVariant = "success"; badgeLabel = "Cleared"; }
        else if (item?.status === "rejected") { badgeVariant = "danger"; badgeLabel = "Rejected"; }
        else if (item?.status === "on_hold") { badgeVariant = "onHold"; badgeLabel = "On Hold"; }

        return (
          <Card key={source.id} padding="none" className="overflow-hidden">
            {/* Accordion header */}
            <div className="flex items-center justify-between p-5">
              <button
                type="button"
                onClick={() => toggleSection(source.id)}
                className="flex items-center gap-3 text-left flex-1 min-w-0"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-cjc-navy">
                      {source.code} — {source.name}
                    </span>
                    <Badge variant={badgeVariant} size="sm">{badgeLabel}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {reqs.length} requirement{reqs.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item && (
                  <button
                    type="button"
                    onClick={() => setHistoryItem({ item, sourceName: `${source.code} — ${source.name}` })}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-cjc-navy transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
                    title="View status history"
                  >
                    <History className="w-3.5 h-3.5" />
                    History
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleSection(source.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Accordion body */}
            {isOpen && (() => {
              const uploadReqs = reqs.filter((r) => r.requires_upload);
              const requiredCheckboxReqs = reqs.filter((r) => !r.requires_upload && r.is_required);
              const existingSubsForItem = item ? (submissionsByItem[item.id] ?? []) : [];
              const allUploaded = uploadReqs.length === 0 || uploadReqs.every((r) => {
                const sub = r.id in localSubOverrides
                  ? localSubOverrides[r.id]
                  : existingSubsForItem.find((s) => s.requirement_id === r.id);
                return sub?.file_url;
              });
              const allRequiredChecked = requiredCheckboxReqs.every((r) => {
                const sub = r.id in localSubOverrides
                  ? localSubOverrides[r.id]
                  : existingSubsForItem.find((s) => s.requirement_id === r.id);
                return sub?.status === 'submitted' || sub?.status === 'verified';
              });
              const isReady = allUploaded && allRequiredChecked;
              const isLocked =
                item?.status === 'submitted' ||
                item?.status === 'approved' ||
                submittedSources.has(source.id);

              const isRejectedOrOnHold =
                item?.status === 'rejected' ||
                item?.status === 'on_hold';

              const isAlreadySubmitted = isLocked || isRejectedOrOnHold;

              return (
              <div className="border-t border-gray-100">
                {reqs.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-400 italic">
                    No submissions required for this source.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {reqs.map((req, index) => {
                      const existingSubs = item ? (submissionsByItem[item.id] ?? []) : [];
                      const propSub = existingSubs.find((s) => s.requirement_id === req.id);
                      // Use optimistic override if present (null = deleted, value = just uploaded)
                      const existingSub = req.id in localSubOverrides
                        ? localSubOverrides[req.id] ?? undefined
                        : propSub;
                      const isUploading = uploadingReqs.has(req.id);
                      const error = fileErrors[req.id];

                      return (
                        <div key={req.id} className="p-5">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            {/* Req info */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 mt-0.5">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-cjc-navy">{req.name}</span>
                                  <span
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                      req.is_required
                                        ? "bg-red-100 text-red-600"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {req.is_required ? "Required" : "Optional"}
                                  </span>
                                </div>
                                {req.description && (
                                  <p className="text-xs text-gray-500 mt-0.5">{req.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Upload area */}
                            <div className="sm:w-72 flex-shrink-0">
                              {req.requires_upload ? (
                                <>
                                  {isUploading ? (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                                      <p className="text-xs text-blue-700">Uploading...</p>
                                    </div>
                                  ) : deletingReqs.has(req.id) ? (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                                      <Loader2 className="w-4 h-4 text-red-400 animate-spin flex-shrink-0" />
                                      <p className="text-xs text-red-600">Removing...</p>
                                    </div>
                                  ) : existingSub && existingSub.file_url ? (
                                    <div className="rounded-lg border border-green-200 bg-green-50 overflow-hidden">
                                      {/* Preview thumbnail for images */}
                                      {!existingSub.file_url.includes('token=') || existingSub.file_url.match(/\.(png|jpe?g|webp)/i) ? (
                                        <button
                                          type="button"
                                          onClick={() => setLightboxUrl(existingSub.file_url)}
                                          className="w-full block group relative"
                                          title="View file"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={existingSub.file_url}
                                            alt="Submitted file"
                                            className="w-full h-28 object-cover"
                                            onError={(e) => {
                                              (e.currentTarget as HTMLImageElement).style.display = "none";
                                              (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "flex");
                                            }}
                                          />
                                          <div className="hidden w-full h-28 items-center justify-center bg-gray-100">
                                            <FileText className="w-8 h-8 text-gray-400" />
                                          </div>
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                          </div>
                                        </button>
                                      ) : (
                                        <a
                                          href={existingSub.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 px-3 py-3 hover:bg-green-100 transition-colors"
                                        >
                                          <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                                          <span className="text-xs font-medium text-green-700">View PDF</span>
                                          <Eye className="w-3.5 h-3.5 text-green-500 ml-auto" />
                                        </a>
                                      )}
                                      {/* Status row + actions */}
                                      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-green-200">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                          <div className="min-w-0">
                                            <p className="text-xs font-medium text-green-700 leading-none">Submitted</p>
                                            {existingSub.submitted_at && (
                                              <p className="text-[10px] text-green-500 mt-0.5">{formatDate(existingSub.submitted_at)}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {!isLocked && (
                                            <>
                                              {/* Replace button */}
                                              <button
                                                type="button"
                                                onClick={() => fileInputRefs.current[req.id]?.click()}
                                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                                title="Replace file"
                                              >
                                                <RefreshCw className="w-3 h-3" />
                                                Replace
                                              </button>
                                              {/* Delete button */}
                                              <button
                                                type="button"
                                                onClick={() => item && setPendingDelete({ reqId: req.id, clearanceItemId: item.id, fileUrl: existingSub.file_url! })}
                                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-100 rounded-md transition-colors"
                                                title="Remove file"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                                Remove
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      {/* Hidden replace input */}
                                      <input
                                        ref={(el) => { fileInputRefs.current[req.id] = el; }}
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.webp,.pdf"
                                        className="sr-only"
                                        onChange={(e) =>
                                          item && handleFileSelect(req.id, item.id, e.target.files?.[0] ?? null)
                                        }
                                      />
                                    </div>
                                  ) : item ? (
                                    <div
                                      className={`relative border-2 border-dashed rounded-lg px-3 py-3 text-center cursor-pointer transition-colors ${
                                        error
                                          ? "border-red-300 bg-red-50"
                                          : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                                      }`}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => item && handleDrop(req.id, item.id, e)}
                                      onClick={() => fileInputRefs.current[req.id]?.click()}
                                    >
                                      <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                                      <p className="text-xs text-gray-500">Click or drag to upload</p>
                                      <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP, PDF</p>
                                      <input
                                        ref={(el) => { fileInputRefs.current[req.id] = el; }}
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.webp,.pdf"
                                        className="sr-only"
                                        onChange={(e) =>
                                          item && handleFileSelect(req.id, item.id, e.target.files?.[0] ?? null)
                                        }
                                      />
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400 italic">
                                      Clearance item not yet created.
                                    </p>
                                  )}

                                  {error && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                      {error}
                                    </p>
                                  )}
                                </>
                              ) : (() => {
                                const isChecked = existingSub?.status === 'submitted' || existingSub?.status === 'verified';
                                const isToggling = togglingReqs.has(req.id);
                                const checkboxLocked = isLocked;
                                return (
                                  <button
                                    type="button"
                                    disabled={isToggling || checkboxLocked}
                                    onClick={() => item && handleCheckboxToggle(req.id, item.id, !!isChecked)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                                      checkboxLocked
                                        ? isChecked
                                          ? "border-green-200 bg-green-50 cursor-default"
                                          : "border-gray-200 bg-gray-50 cursor-default opacity-60"
                                        : isChecked
                                          ? "border-green-300 bg-green-50 hover:bg-green-100"
                                          : "border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                                    }`}
                                  >
                                    {isToggling ? (
                                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
                                    ) : (
                                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                                        isChecked
                                          ? "bg-green-500 border-green-500"
                                          : "border-gray-400 bg-white"
                                      }`}>
                                        {isChecked && <CheckCircle className="w-3 h-3 text-white" />}
                                      </div>
                                    )}
                                    <span className={`text-xs font-medium ${isChecked ? "text-green-700" : "text-gray-500"}`}>
                                      {isChecked ? "Confirmed" : "Click to confirm compliance"}
                                    </span>
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {item && (
                  <div className="border-t border-gray-100">
                    {isRejectedOrOnHold ? (
                      <div className="px-5 py-4 space-y-3">
                        {item.remarks && (
                          <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                            item.status === 'on_hold'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                              item.status === 'on_hold' ? 'text-yellow-500' : 'text-red-500'
                            }`} />
                            <div>
                              <p className={`text-xs font-semibold ${
                                item.status === 'on_hold' ? 'text-yellow-700' : 'text-red-700'
                              }`}>
                                {item.status === 'rejected' ? 'Rejected' : 'On Hold'} — Remarks from Reviewer
                              </p>
                              <p className={`text-xs mt-0.5 ${
                                item.status === 'on_hold' ? 'text-yellow-600' : 'text-red-600'
                              }`}>{item.remarks}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs text-gray-500">
                            {item.status === 'on_hold'
                              ? !allUploaded
                                ? "Follow the remarks above, then upload required files before resubmitting."
                                : !allRequiredChecked
                                ? "Follow the remarks above, then confirm all required items before resubmitting."
                                : "Complete any steps in the remarks above, then resubmit when ready."
                              : !allUploaded
                              ? "Upload all required files before resubmitting."
                              : !allRequiredChecked
                              ? "Confirm all required items before resubmitting."
                              : "Address the remarks above, then resubmit."}
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!isReady || submittingSource === source.id}
                            isLoading={submittingSource === source.id}
                            onClick={() => setPendingSubmit({ sourceId: source.id, item })}
                          >
                            Resubmit for Review
                          </Button>
                        </div>
                      </div>
                    ) : isLocked ? (
                      <div className="px-5 py-3 flex items-center gap-2 bg-green-50">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-green-700">
                          {item.status === 'approved'
                            ? `Cleared by ${sourceType}`
                            : 'Submitted for review'}
                        </span>
                      </div>
                    ) : (
                      <div className="px-5 py-3 flex items-center justify-between gap-4 bg-gray-50">
                        <p className="text-xs text-gray-500">
                          {!allUploaded
                            ? "Upload all required files before submitting."
                            : !allRequiredChecked
                            ? "Confirm all required items before submitting."
                            : "Ready — click to send for review."}
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!isReady || submittingSource === source.id}
                          isLoading={submittingSource === source.id}
                          onClick={() => setPendingSubmit({ sourceId: source.id, item })}
                        >
                          Submit for Review
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })()}
          </Card>
        );
      })}
    </div>

    <ConfirmDialog
      isOpen={!!pendingSubmit}
      onClose={() => setPendingSubmit(null)}
      onConfirm={() => {
        if (pendingSubmit) {
          handleSubmitForReview(pendingSubmit.sourceId, pendingSubmit.item);
          setPendingSubmit(null);
        }
      }}
      title={
        pendingSubmit?.item?.status === 'rejected' || pendingSubmit?.item?.status === 'on_hold'
          ? "Resubmit for Review?"
          : "Submit for Review?"
      }
      message={
        pendingSubmit?.item?.status === 'rejected' || pendingSubmit?.item?.status === 'on_hold'
          ? "You are resubmitting after the department's review. Make sure you've addressed the remarks before continuing."
          : "Once submitted, your clearance request enters the review queue. Make sure all required documents are correct before continuing."
      }
      confirmText={
        pendingSubmit?.item?.status === 'rejected' || pendingSubmit?.item?.status === 'on_hold'
          ? "Resubmit"
          : "Submit"
      }
      cancelText="Go Back"
      variant="info"
      isLoading={submittingSource !== null}
    />

    <ConfirmDialog
      isOpen={!!pendingDelete}
      onClose={() => setPendingDelete(null)}
      onConfirm={() => {
        if (pendingDelete) {
          handleDeleteFile(pendingDelete.reqId, pendingDelete.clearanceItemId, pendingDelete.fileUrl);
          setPendingDelete(null);
        }
      }}
      title="Remove File?"
      message="Are you sure you want to remove this uploaded file? You can upload a new one before submitting."
      confirmText="Remove"
      cancelText="Cancel"
      variant="warning"
      isLoading={pendingDelete ? deletingReqs.has(pendingDelete.reqId) : false}
    />

    {/* History Timeline Modal */}
    <Modal
      isOpen={!!historyItem}
      onClose={() => setHistoryItem(null)}
      className="max-w-lg"
    >
      {historyItem && (
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-display font-bold text-cjc-navy">Status History</h2>
            <p className="text-sm text-gray-500 mt-0.5">{historyItem.sourceName}</p>
          </div>
          <ClearanceItemHistoryTimeline clearanceItemId={historyItem.item.id} />
        </div>
      )}
    </Modal>
    </>
  );
}
