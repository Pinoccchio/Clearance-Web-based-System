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
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  RefreshCw,
  Users,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  MinusCircle,
  Eye,
  X,
} from "lucide-react";
import { StudentClearanceProgressModal } from "@/components/features/StudentClearanceProgressModal";
import {
  Department,
  Profile,
  ClearanceRequest,
  ClearanceItem,
  SystemSettings,
  DistinctPeriod,
  getDepartmentByHeadId,
  getStudentsByDepartment,
  getClearanceRequestsByStudentIds,
  getClearanceItemsBySourceAndRequests,
  getSystemSettings,
  getDistinctPeriods,
} from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

type ClearanceStatus = "completed" | "in_progress" | "pending" | "none";
type ItemStatus = "pending" | "submitted" | "approved" | "rejected" | "on_hold" | null;

interface StudentWithClearance extends Profile {
  latestRequest: ClearanceRequest | null;
  deptItem: ClearanceItem | null;
  clearanceStatus: ClearanceStatus;
  deptStatus: ItemStatus;
}

/**
 * Derive overall clearance status from the request (not the department item).
 */
function deriveOverallStatus(request: ClearanceRequest | null): ClearanceStatus {
  if (!request) return "none";
  return request.status as ClearanceStatus;
}

/**
 * Derive department-specific item status.
 */
function deriveDeptStatus(item: ClearanceItem | null): ItemStatus {
  if (!item) return null;
  return item.status as ItemStatus;
}

function ClearanceBadge({ status }: { status: ClearanceStatus }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="approved" size="sm">
          <CheckCircle className="w-3 h-3" />
          Completed
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="pending" size="sm">
          <Clock className="w-3 h-3" />
          In Progress
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="neutral" size="sm">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size="sm">
          <MinusCircle className="w-3 h-3" />
          No Request
        </Badge>
      );
  }
}

function DeptStatusBadge({ status }: { status: ItemStatus }) {
  switch (status) {
    case "approved":
      return (
        <Badge variant="approved" size="sm">
          <CheckCircle className="w-3 h-3" />
          Approved
        </Badge>
      );
    case "submitted":
      return (
        <Badge variant="pending" size="sm">
          <Clock className="w-3 h-3" />
          Submitted
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="neutral" size="sm">
          <Clock className="w-3 h-3" />
          Not Started
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
        <Badge variant="warning" size="sm">
          <Clock className="w-3 h-3" />
          On Hold
        </Badge>
      );
    default:
      return <span className="text-sm text-gray-400">—</span>;
  }
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "none", label: "No Request" },
];

export default function DepartmentStudentsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [department, setDepartment] = useState<Department | null>(null);
  const [students, setStudents] = useState<StudentWithClearance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithClearance | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [periodFilter, setPeriodFilter] = useState("");
  const [distinctPeriods, setDistinctPeriods] = useState<DistinctPeriod[]>([]);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      // 1. Find this user's department + fetch system settings
      const [dept, settings] = await Promise.all([
        getDepartmentByHeadId(profile.id),
        getSystemSettings(),
      ]);
      setSystemSettings(settings);

      // Fetch distinct periods, injecting the current system period so it always appears
      const periods = await getDistinctPeriods(
        settings ? { academic_year: settings.academic_year, semester: settings.current_semester } : undefined
      );
      setDistinctPeriods(periods);

      // Initialize periodFilter to current period on first load
      const currentKey = settings ? `${settings.academic_year}|${settings.current_semester}` : "";
      setPeriodFilter((prev) => (prev === "" ? currentKey : prev));
      if (!dept) {
        setDepartment(null);
        setStudents([]);
        return;
      }
      setDepartment(dept);

      // 2. Fetch students belonging to this department
      // profiles.department stores the dept code (e.g. "CCIS"), not the full name
      const studentProfiles = await getStudentsByDepartment(dept.code);

      if (studentProfiles.length === 0) {
        setStudents([]);
        return;
      }

      // 3. Fetch their clearance requests
      const studentIds = studentProfiles.map((s) => s.id);
      const requests = await getClearanceRequestsByStudentIds(studentIds);

      // 4. Map: pick latest request per student for the selected period
      const effectiveFilter = periodFilter || currentKey;
      const [filterYear, filterSemester] = effectiveFilter.split("|");
      const activeMap = new Map<string, ClearanceRequest>();
      for (const req of requests) {
        if (!activeMap.has(req.student_id) && req.academic_year === filterYear && req.semester === filterSemester) {
          activeMap.set(req.student_id, req);
        }
      }

      // 5. Fetch department-specific clearance items for these requests
      const requestIds = requests.map((r) => r.id);
      const deptItems = await getClearanceItemsBySourceAndRequests('department', dept.id, requestIds);

      // Map items by request_id for quick lookup
      const itemByRequest = new Map<string, ClearanceItem>();
      for (const item of deptItems) {
        itemByRequest.set(item.request_id, item);
      }

      // 6. Build StudentWithClearance[] using overall request status + dept item status
      const enriched: StudentWithClearance[] = studentProfiles.map((s) => {
        const latestRequest = activeMap.get(s.id) ?? null;
        const deptItem = latestRequest ? itemByRequest.get(latestRequest.id) ?? null : null;
        return {
          ...s,
          latestRequest,
          deptItem,
          clearanceStatus: deriveOverallStatus(latestRequest),
          deptStatus: deriveDeptStatus(deptItem),
        };
      });

      setStudents(enriched);
    } catch (err) {
      console.error("Error loading department students:", err);
      showToast("error", "Load Failed", "Could not load students. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, showToast, periodFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtimeRefresh('clearance_requests', loadData);

  // --- Computed stats ---
  const totalCount = students.length;
  const completedCount = students.filter((s) => s.clearanceStatus === "completed").length;
  const inProgressCount = students.filter((s) => s.clearanceStatus === "in_progress").length;
  const pendingCount = students.filter((s) => s.clearanceStatus === "pending").length;
  const noRequestCount = students.filter((s) => s.clearanceStatus === "none").length;

  // --- Filtered list ---
  const filtered = students.filter((s) => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const studentId = (s.student_id ?? "").toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      studentId.includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || s.clearanceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const typeLabel = (type: string | undefined) => {
    if (!type) return "—";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">
            Department{department ? `: ${department.name}` : ""}
          </p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">Students</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-cjc-navy">
              {isLoading ? "..." : totalCount}
            </p>
            <p className="text-sm text-gray-500">Total Students</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {isLoading ? "..." : completedCount}
            </p>
            <p className="text-sm text-gray-500">Completed</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {isLoading ? "..." : inProgressCount}
            </p>
            <p className="text-sm text-gray-500">In Progress</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {isLoading ? "..." : pendingCount}
            </p>
            <p className="text-sm text-gray-500">Pending</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-gray-500">
              {isLoading ? "..." : noRequestCount}
            </p>
            <p className="text-sm text-gray-500">No Request</p>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-64">
            <Select
              options={[
...distinctPeriods.map((p) => {
                  const key = `${p.academic_year}|${p.semester}`;
                  const isCurrent = systemSettings &&
                    p.academic_year === systemSettings.academic_year &&
                    p.semester === systemSettings.current_semester;
                  return {
                    value: key,
                    label: isCurrent ? `${p.academic_year} — ${p.semester} (Current)` : `${p.academic_year} — ${p.semester}`,
                  };
                }),
              ]}
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
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

        {/* Table */}
        <Card padding="none">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cjc-navy animate-spin" />
              <span className="ml-3 text-gray-600">Loading students...</span>
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-gray-400" />}
              title="No Students Found"
              description={
                department
                  ? `No students are registered under the ${department.name} department.`
                  : "Your department could not be found."
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="w-8 h-8 text-gray-400" />}
              title="No Results"
              description="No students match your search or filter criteria."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Year Level</TableHead>
                  <TableHead>Clearance Status</TableHead>
                  <TableHead>Dept Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => {
                  const fullName = `${student.first_name} ${student.last_name}`;
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={student.avatar_url ?? undefined}
                            name={fullName}
                            size="sm"
                            variant="primary"
                            className={student.avatar_url ? "cursor-pointer" : ""}
                            onClick={() => student.avatar_url && setPreviewUrl(student.avatar_url)}
                          />
                          <div>
                            <p className="font-medium text-cjc-navy">{fullName}</p>
                            <p className="text-xs text-gray-500">
                              {student.student_id ?? "No ID"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {student.course ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {student.year_level ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ClearanceBadge status={student.clearanceStatus} />
                      </TableCell>
                      <TableCell>
                        <DeptStatusBadge status={student.deptStatus} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStudent(student)}
                          className="text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {typeLabel(student.latestRequest?.type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {student.latestRequest
                            ? `${student.latestRequest.academic_year} — ${student.latestRequest.semester}`
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {student.latestRequest
                            ? formatDate(student.latestRequest.created_at)
                            : "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Footer count */}
        {!isLoading && students.length > 0 && (
          <p className="text-sm text-gray-500">
            Showing {filtered.length} of {totalCount} students
          </p>
        )}
      </div>

      {/* Image preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewUrl}
              alt="Profile preview"
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

      {/* Overall clearance progress modal */}
      <StudentClearanceProgressModal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
        latestRequest={selectedStudent?.latestRequest ?? null}
      />
    </div>
  );
}
