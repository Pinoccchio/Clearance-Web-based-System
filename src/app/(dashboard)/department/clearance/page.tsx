"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/Toast";
import {
  ClipboardList,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  PauseCircle,
  ExternalLink,
} from "lucide-react";
import {
  Department,
  ClearanceItemWithDetails,
  SubmissionWithRequirement,
  getDepartmentByHeadId,
  getClearanceItemsByDepartment,
  updateClearanceItem,
  getSubmissionsByItem,
} from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "on_hold", label: "On Hold" },
];

function ItemStatusBadge({ status }: { status: ClearanceItemWithDetails["status"] }) {
  switch (status) {
    case "approved":
      return (
        <Badge variant="approved" size="sm">
          <CheckCircle className="w-3 h-3" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="rejected" size="sm">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      );
    case "on_hold":
      return (
        <Badge variant="neutral" size="sm">
          <PauseCircle className="w-3 h-3" />
          On Hold
        </Badge>
      );
    default:
      return (
        <Badge variant="pending" size="sm">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
  }
}

function SubmissionStatusBadge({ status }: { status: SubmissionWithRequirement["status"] }) {
  switch (status) {
    case "verified":
      return <Badge variant="approved" size="sm">Verified</Badge>;
    case "submitted":
      return <Badge variant="info" size="sm">Submitted</Badge>;
    case "rejected":
      return <Badge variant="rejected" size="sm">Rejected</Badge>;
    default:
      return <Badge variant="neutral" size="sm">Pending</Badge>;
  }
}

function TypeBadge({ type }: { type: string }) {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  const variant =
    type === "graduation" ? "gold" : type === "transfer" ? "info" : "default";
  return <Badge variant={variant} size="sm">{label}</Badge>;
}

export default function DepartmentClearancePage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [department, setDepartment] = useState<Department | null>(null);
  const [items, setItems] = useState<ClearanceItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail modal state
  const [selectedItem, setSelectedItem] = useState<ClearanceItemWithDetails | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithRequirement[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Action state
  const [actionType, setActionType] = useState<"approved" | "rejected" | "on_hold" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const dept = await getDepartmentByHeadId(profile.id);
      if (!dept) {
        setError("Your department could not be found.");
        setItems([]);
        return;
      }
      setDepartment(dept);

      const data = await getClearanceItemsByDepartment(dept.id);
      setItems(data);
    } catch (err) {
      console.error("Error loading clearance items:", err);
      setError("Failed to load clearance requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load submissions when a modal item is selected
  useEffect(() => {
    if (!selectedItem) {
      setSubmissions([]);
      setActionType(null);
      setRemarks("");
      return;
    }

    setIsLoadingSubmissions(true);
    getSubmissionsByItem(selectedItem.id)
      .then(setSubmissions)
      .catch((err) => {
        console.error("Error loading submissions:", err);
        showToast("error", "Load Failed", "Could not load requirement submissions.");
      })
      .finally(() => setIsLoadingSubmissions(false));
  }, [selectedItem, showToast]);

  // Filtered items
  const filtered = items.filter((item) => {
    const student = item.request?.student;
    const fullName = student
      ? `${student.first_name} ${student.last_name}`.toLowerCase()
      : "";
    const studentNum = (student?.student_id ?? "").toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      studentNum.includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleAction() {
    if (!selectedItem || !actionType || !profile?.id) return;

    setIsSubmitting(true);
    try {
      const updated = await updateClearanceItem(selectedItem.id, {
        status: actionType,
        remarks: remarks.trim() || undefined,
        reviewed_by: profile.id,
      });

      // Update local state
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? { ...i, status: updated.status, remarks: updated.remarks, reviewed_at: updated.reviewed_at }
            : i
        )
      );

      const actionLabel =
        actionType === "approved"
          ? "approved"
          : actionType === "rejected"
          ? "rejected"
          : "put on hold";

      showToast("success", "Action Recorded", `Clearance item has been ${actionLabel}.`);
      setSelectedItem(null);
    } catch (err) {
      console.error("Error updating clearance item:", err);
      showToast("error", "Update Failed", "Could not update the clearance item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const student = selectedItem?.request?.student;
  const request = selectedItem?.request;

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">
            Department{department ? `: ${department.name}` : ""}
          </p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">Clearance Queue</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by student name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-48">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Main content */}
        <Card padding="none">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-cjc-navy animate-spin" />
              <span className="ml-3 text-gray-600">Loading clearance requests...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-8 h-8 text-gray-400" />}
              title="No Clearance Requests"
              description="No students have submitted clearance requests for your department yet."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="w-8 h-8 text-gray-400" />}
              title="No Results"
              description="No clearance requests match your search or filter criteria."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course &amp; Year</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const s = item.request?.student;
                  const fullName = s ? `${s.first_name} ${s.last_name}` : "Unknown";
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={s?.avatar_url ?? undefined}
                            name={fullName}
                            size="sm"
                            variant="primary"
                          />
                          <div>
                            <p className="font-medium text-cjc-navy">{fullName}</p>
                            <p className="text-xs text-gray-500 font-mono">
                              {s?.student_id ?? "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {s?.course ?? "—"} · Year {s?.year_level ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={item.request?.type ?? "semester"} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {item.request
                            ? `${item.request.academic_year} — ${item.request.semester}`
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(item.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ItemStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Footer count */}
        {!isLoading && !error && items.length > 0 && (
          <p className="text-sm text-gray-500">
            Showing {filtered.length} of {items.length} requests
          </p>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        className="max-w-2xl"
      >
        {selectedItem && (
          <div className="p-6 space-y-6">
            {/* Student Info */}
            <div className="flex items-start gap-4 pr-8">
              <Avatar
                src={student?.avatar_url ?? undefined}
                name={student ? `${student.first_name} ${student.last_name}` : "?"}
                size="lg"
                variant="primary"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-display font-bold text-cjc-navy">
                  {student ? `${student.first_name} ${student.last_name}` : "Unknown"}
                </h2>
                <p className="text-sm text-gray-500 font-mono">{student?.student_id ?? "—"}</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {student?.course ?? "—"} · Year {student?.year_level ?? "—"}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <TypeBadge type={request?.type ?? "semester"} />
                  <span className="text-xs text-gray-500">
                    {request
                      ? `${request.academic_year} — ${request.semester}`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Item Status</span>
                <ItemStatusBadge status={selectedItem.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Submitted</span>
                <span className="text-xs text-gray-600">{formatDate(selectedItem.created_at)}</span>
              </div>
              {selectedItem.reviewed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Reviewed</span>
                  <span className="text-xs text-gray-600">{formatDate(selectedItem.reviewed_at)}</span>
                </div>
              )}
              {selectedItem.remarks && (
                <div className="pt-1">
                  <span className="text-xs text-gray-500">Remarks: </span>
                  <span className="text-xs text-gray-700">{selectedItem.remarks}</span>
                </div>
              )}
            </div>

            {/* Requirements / Submissions */}
            <div>
              <h3 className="text-sm font-semibold text-cjc-navy mb-3">Requirement Submissions</h3>
              {isLoadingSubmissions ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading submissions...</span>
                </div>
              ) : submissions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No requirement submissions yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-800">
                            {sub.requirement?.name ?? "—"}
                          </p>
                          {sub.requirement?.is_required && (
                            <Badge variant="danger" size="sm">Required</Badge>
                          )}
                        </div>
                        {sub.requirement?.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {sub.requirement.description}
                          </p>
                        )}
                        {sub.remarks && (
                          <p className="text-xs text-amber-600 mt-0.5">{sub.remarks}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <SubmissionStatusBadge status={sub.status} />
                        {sub.file_url && (
                          <a
                            href={sub.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            title="View file"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action section (only if not yet approved) */}
            {selectedItem.status !== "approved" && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-cjc-navy">Take Action</h3>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={actionType === "approved" ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setActionType("approved")}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    variant={actionType === "rejected" ? "danger" : "secondary"}
                    size="sm"
                    onClick={() => setActionType("rejected")}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActionType("on_hold")}
                    className={actionType === "on_hold" ? "border-amber-400 bg-amber-50 text-amber-700" : ""}
                  >
                    <PauseCircle className="w-4 h-4" />
                    On Hold
                  </Button>
                </div>

                {/* Remarks */}
                {actionType && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Remarks{actionType === "approved" ? " (optional)" : " (recommended)"}
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cjc-navy/30 resize-none"
                      rows={3}
                      placeholder={
                        actionType === "approved"
                          ? "Add optional remarks..."
                          : "Explain the reason..."
                      }
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                )}

                {/* Confirm */}
                {actionType && (
                  <Button
                    variant="primary"
                    onClick={handleAction}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Confirm {actionType === "approved" ? "Approval" : actionType === "rejected" ? "Rejection" : "Hold"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
