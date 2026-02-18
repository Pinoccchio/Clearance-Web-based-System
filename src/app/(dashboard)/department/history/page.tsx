"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
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
  History,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  PauseCircle,
  ExternalLink,
} from "lucide-react";
import {
  Department,
  ClearanceItemWithDetails,
  SubmissionWithRequirement,
  getDepartmentByHeadId,
  getProcessedClearanceItemsByDepartment,
  getSubmissionsByItem,
} from "@/lib/supabase";
import ClearanceItemHistoryTimeline from "@/components/shared/ClearanceItemHistoryTimeline";
import { formatDate } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "on_hold", label: "On Hold" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "semester", label: "Semester" },
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
        <Badge variant="onHold" size="sm">
          <PauseCircle className="w-3 h-3" />
          On Hold
        </Badge>
      );
    default:
      return null;
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

function TypeBadge({ type: _ }: { type: string }) {
  return <Badge variant="default" size="sm">Semester</Badge>;
}

export default function DepartmentHistoryPage() {
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

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
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

      const data = await getProcessedClearanceItemsByDepartment(dept.id);
      setItems(data);
    } catch (err) {
      console.error("Error loading history:", err);
      setError("Failed to load clearance history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtimeRefresh('clearance_items', loadData);

  // Load submissions when a modal item is selected
  useEffect(() => {
    if (!selectedItem) {
      setSubmissions([]);
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

  // Stats
  const approvedCount = items.filter((i) => i.status === "approved").length;
  const rejectedCount = items.filter((i) => i.status === "rejected").length;
  const onHoldCount = items.filter((i) => i.status === "on_hold").length;

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
    const matchesType =
      typeFilter === "all" || item.request?.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const student = selectedItem?.request?.student;
  const request = selectedItem?.request;

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">
            Department{department ? `: ${department.name}` : ""}
          </p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">Clearance History</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats row */}
        {!isLoading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card padding="sm">
              <p className="text-xs text-gray-500 mb-1">Total Reviewed</p>
              <p className="text-2xl font-bold text-cjc-navy">{items.length}</p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-gray-500 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-gray-500 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-gray-500 mb-1">On Hold</p>
              <p className="text-2xl font-bold text-gray-500">{onHoldCount}</p>
            </Card>
          </div>
        )}

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
          <div className="w-44">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Select
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
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
              <span className="ml-3 text-gray-600">Loading history...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<History className="w-8 h-8 text-gray-400" />}
              title="No History Yet"
              description="Processed clearance requests will appear here."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="w-8 h-8 text-gray-400" />}
              title="No Results"
              description="No records match your filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course &amp; Year</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Details</TableHead>
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
                        <ItemStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {item.reviewed_at ? formatDate(item.reviewed_at) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          View
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
            Showing {filtered.length} of {items.length} records
          </p>
        )}
      </div>

      {/* Detail Modal (read-only) */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        className="max-w-2xl"
      >
        {selectedItem && (
          <div className="p-6 space-y-6">
            {/* Student header */}
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

            {/* Review summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Status</span>
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
              {selectedItem.reviewed_by && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Reviewed by</span>
                  <span className="text-xs text-gray-600">{department?.name ?? "Department"}</span>
                </div>
              )}
              {selectedItem.remarks && (
                <div className="pt-1">
                  <span className="text-xs text-gray-500">Remarks: </span>
                  <span className="text-xs text-gray-700">{selectedItem.remarks}</span>
                </div>
              )}
            </div>

            {/* Status history timeline */}
            <div>
              <h3 className="text-sm font-semibold text-cjc-navy mb-3">Status History</h3>
              <ClearanceItemHistoryTimeline clearanceItemId={selectedItem.id} />
            </div>

            {/* Requirement submissions */}
            <div>
              <h3 className="text-sm font-semibold text-cjc-navy mb-3">Requirement Submissions</h3>
              {isLoadingSubmissions ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading submissions...</span>
                </div>
              ) : submissions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No requirement submissions on record.
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
          </div>
        )}
      </Modal>
    </div>
  );
}
