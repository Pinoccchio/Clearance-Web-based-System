"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/auth-context";
import {
  Department,
  Requirement,
  SystemSettings,
  ClearanceRequest,
  getDepartmentByCode,
  getRequirementsBySource,
  getSystemSettings,
  getStudentClearanceRequests,
  createClearanceRequest,
  getClearanceItemForRequest,
  upsertRequirementSubmission,
} from "@/lib/supabase";
import { uploadSubmissionFile, validateSubmissionFile } from "@/lib/storage";
import {
  Upload,
  CheckCircle,
  FileText,
  X,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";

type ClearanceType = "semester" | "graduation" | "transfer";

const CLEARANCE_TYPE_LABELS: Record<ClearanceType, string> = {
  semester: "Semester Clearance",
  graduation: "Graduation Clearance",
  transfer: "Transfer Clearance",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: ClearanceRequest["status"] }) {
  const config = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
    in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
    approved: { label: "Approved", className: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
    completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  };
  const { label, className } = config[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default function StudentSubmitPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Data
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [existingRequest, setExistingRequest] = useState<ClearanceRequest | null>(null);

  // Form
  const [selectedType, setSelectedType] = useState<ClearanceType>("semester");
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  // UI
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");

  // File input refs (one per requirement)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load data once profile is available
  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      setIsLoading(false);
      return;
    }
    if (!profile.department) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        const [sys, dept, existingRequests] = await Promise.all([
          getSystemSettings(),
          getDepartmentByCode(profile!.department!),
          getStudentClearanceRequests(profile!.id),
        ]);

        if (cancelled) return;

        setSettings(sys);
        setDepartment(dept);

        // Find an active (non-completed, non-rejected) request
        const active = existingRequests.find(
          (r) => r.status === "pending" || r.status === "in_progress"
        );
        setExistingRequest(active ?? null);

        // Load requirements only if we have a department
        if (dept) {
          const reqs = await getRequirementsBySource("department", dept.id);
          if (!cancelled) setRequirements(reqs);
        }

        // Set default type to first allowed type
        if (sys) {
          if (sys.allow_semester_clearance) setSelectedType("semester");
          else if (sys.allow_transfer_clearance) setSelectedType("transfer");
          else if (sys.allow_graduation_clearance) setSelectedType("graduation");
        }
      } catch (err) {
        console.error("Failed to load submission data:", err);
        showToast("error", "Failed to load page data", "Please refresh and try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [authLoading, profile, showToast]);

  // Derived: allowed clearance types
  const allowedTypes: ClearanceType[] = settings
    ? [
        ...(settings.allow_semester_clearance ? (["semester"] as ClearanceType[]) : []),
        ...(settings.allow_transfer_clearance ? (["transfer"] as ClearanceType[]) : []),
        ...(settings.allow_graduation_clearance ? (["graduation"] as ClearanceType[]) : []),
      ]
    : [];

  // Derived: required file count
  const requiredReqs = requirements.filter((r) => r.is_required);
  const attachedRequiredCount = requiredReqs.filter((r) => fileMap[r.id]).length;
  const allRequiredAttached = attachedRequiredCount === requiredReqs.length;

  // Handle file select (from input)
  function handleFileSelect(reqId: string, file: File | null) {
    if (!file) return;

    const validation = validateSubmissionFile(file);
    if (!validation.valid) {
      setFileErrors((prev) => ({ ...prev, [reqId]: validation.error! }));
      return;
    }

    setFileErrors((prev) => {
      const next = { ...prev };
      delete next[reqId];
      return next;
    });
    setFileMap((prev) => ({ ...prev, [reqId]: file }));
  }

  // Remove a selected file
  function removeFile(reqId: string) {
    setFileMap((prev) => {
      const next = { ...prev };
      delete next[reqId];
      return next;
    });
    setFileErrors((prev) => {
      const next = { ...prev };
      delete next[reqId];
      return next;
    });
    // Reset the input
    if (fileInputRefs.current[reqId]) {
      fileInputRefs.current[reqId]!.value = "";
    }
  }

  // Handle drag-over
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Handle drop
  function handleDrop(reqId: string, e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(reqId, file);
  }

  // Submit handler
  async function handleSubmit() {
    if (!profile || !department || !settings) return;
    if (!allRequiredAttached) {
      showToast("error", "Missing required files", "Please attach all required documents.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create clearance request
      const request = await createClearanceRequest({
        student_id: profile.id,
        type: selectedType,
        academic_year: settings.academic_year,
        semester: settings.current_semester,
      });

      // 2. Wait briefly for the trigger to fire and create clearance_items
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 3. Fetch the clearance_item for our department
      const clearanceItem = await getClearanceItemForRequest(
        request.id,
        "department",
        department.id
      );

      if (!clearanceItem) {
        throw new Error("Clearance item was not created. Please contact support.");
      }

      // 4. Upload files and create submissions
      const uploadErrors: string[] = [];

      for (const req of requirements) {
        const file = fileMap[req.id];
        if (!file) continue; // skip optional reqs with no file

        try {
          const url = await uploadSubmissionFile(file, profile.id, req.id);
          await upsertRequirementSubmission({
            clearance_item_id: clearanceItem.id,
            requirement_id: req.id,
            student_id: profile.id,
            file_url: url,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          uploadErrors.push(`${req.name}: ${msg}`);
        }
      }

      if (uploadErrors.length > 0) {
        showToast(
          "warning",
          "Some files failed to upload",
          uploadErrors.join("; ")
        );
      }

      // 5. Show success
      setStep("success");
    } catch (err) {
      console.error("Submission failed:", err);
      const msg = err instanceof Error ? err.message : "An error occurred during submission.";
      showToast("error", "Submission failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Guard: auth loading ──────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit Clearance" subtitle="Submit your clearance request" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // ── Guard: no profile / not student ─────────────────────────────
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit Clearance" subtitle="Submit your clearance request" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-cjc-navy mb-1">Not Authenticated</h3>
            <p className="text-sm text-gray-500">Please log in to access this page.</p>
          </Card>
        </div>
      </div>
    );
  }

  // ── Guard: no department ─────────────────────────────────────────
  if (!profile.department) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit Clearance" subtitle="Submit your clearance request" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <Info className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-cjc-navy mb-1">No Department Assigned</h3>
            <p className="text-sm text-gray-500">
              Your account does not have a department. Please contact the registrar.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // ── Guard: no enabled clearance types ───────────────────────────
  if (allowedTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit Clearance" subtitle="Submit your clearance request" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-cjc-navy mb-1">Submissions Closed</h3>
            <p className="text-sm text-gray-500">
              Clearance submissions are not currently open. Check back later.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // ── Guard: existing active request ───────────────────────────────
  if (existingRequest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit Clearance" subtitle="Submit your clearance request" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-md w-full">
            <CheckCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-cjc-navy mb-1">
              Request Already Submitted
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              You already have an active clearance request. You cannot submit another until your
              current request is resolved.
            </p>
            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="text-sm text-gray-600">Current status:</span>
              <StatusBadge status={existingRequest.status} />
            </div>
            <Button
              variant="gold"
              size="md"
              onClick={() => router.push("/student/clearance")}
            >
              View Clearance Status
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Guard: no requirements ───────────────────────────────────────
  if (requirements.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit Clearance" subtitle="Submit your clearance request" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-cjc-navy mb-1">No Requirements Yet</h3>
            <p className="text-sm text-gray-500">
              Your department has not defined any clearance requirements yet.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // ── Success view ─────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit Clearance" subtitle="Submit your clearance request" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-cjc-navy mb-2">
              Clearance Request Submitted!
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Your request is now pending review by your department.
            </p>
            <Button
              variant="gold"
              size="md"
              onClick={() => router.push("/student/clearance")}
            >
              View Clearance Status
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Submit Clearance"
        subtitle={department ? `${department.name} (${department.code})` : "Submit your clearance request"}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Clearance Type */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Clearance Type</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-3 mt-2">
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
                    selectedType === type
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300"
                  }`}
                />
                {CLEARANCE_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </Card>

        {/* Academic Period (read-only) */}
        {settings && (
          <Card padding="md">
            <CardHeader>
              <CardTitle>Academic Period</CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-6 mt-2 text-sm text-gray-600">
              <div>
                <span className="font-medium text-gray-700">Academic Year:</span>{" "}
                {settings.academic_year}
              </div>
              <div>
                <span className="font-medium text-gray-700">Semester:</span>{" "}
                {settings.current_semester}
              </div>
            </div>
          </Card>
        )}

        {/* Requirements */}
        <Card padding="none">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle>Department Requirements</CardTitle>
              <span className="text-sm text-gray-500">
                {attachedRequiredCount}/{requiredReqs.length} required files attached
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Accepted formats: PNG, JPG, WEBP, PDF (max 10MB each)
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {requirements.map((req, index) => {
              const file = fileMap[req.id];
              const error = fileErrors[req.id];

              return (
                <div key={req.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Index + info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-cjc-navy">
                            {req.name}
                          </span>
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

                    {/* File upload area */}
                    <div className="sm:w-72 flex-shrink-0">
                      {file ? (
                        /* File selected */
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                          <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-green-700 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-green-600">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(req.id)}
                            className="flex-shrink-0 p-1 hover:bg-green-100 rounded text-green-600"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        /* Drop zone */
                        <div
                          className={`relative border-2 border-dashed rounded-lg px-3 py-3 text-center cursor-pointer transition-colors ${
                            error
                              ? "border-red-300 bg-red-50"
                              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                          }`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(req.id, e)}
                          onClick={() => fileInputRefs.current[req.id]?.click()}
                        >
                          <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">
                            Click or drag to upload
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            PNG, JPG, WEBP, PDF
                          </p>
                          <input
                            ref={(el) => { fileInputRefs.current[req.id] = el; }}
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp,.pdf"
                            className="sr-only"
                            onChange={(e) => handleFileSelect(req.id, e.target.files?.[0] ?? null)}
                          />
                        </div>
                      )}

                      {error && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          {error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Submit button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8">
          <p className="text-sm text-gray-500">
            {allRequiredAttached
              ? "All required files attached. Ready to submit."
              : `${requiredReqs.length - attachedRequiredCount} required file(s) still needed.`}
          </p>
          <Button
            variant="gold"
            size="lg"
            disabled={!allRequiredAttached || isSubmitting}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Clearance Request"}
          </Button>
        </div>
      </div>
    </div>
  );
}
