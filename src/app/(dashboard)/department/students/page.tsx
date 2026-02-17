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
  X,
} from "lucide-react";
import {
  Department,
  Profile,
  ClearanceRequest,
  getDepartmentByHeadId,
  getStudentsByDepartment,
  getClearanceRequestsByStudentIds,
} from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

type ClearanceStatus = "cleared" | "pending" | "in_progress" | "rejected" | "none";

interface StudentWithClearance extends Profile {
  latestRequest: ClearanceRequest | null;
  clearanceStatus: ClearanceStatus;
}

function deriveStatus(request: ClearanceRequest | null): ClearanceStatus {
  if (!request) return "none";
  switch (request.status) {
    case "approved":
    case "completed":
      return "cleared";
    case "pending":
      return "pending";
    case "in_progress":
      return "in_progress";
    case "rejected":
      return "rejected";
    default:
      return "none";
  }
}

function ClearanceBadge({ status }: { status: ClearanceStatus }) {
  switch (status) {
    case "cleared":
      return (
        <Badge variant="approved" size="sm">
          <CheckCircle className="w-3 h-3" />
          Cleared
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="pending" size="sm">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="warning" size="sm">
          <Clock className="w-3 h-3" />
          In Progress
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="rejected" size="sm">
          <XCircle className="w-3 h-3" />
          Rejected
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

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "cleared", label: "Cleared" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "rejected", label: "Rejected" },
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

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      // 1. Find this user's department
      const dept = await getDepartmentByHeadId(profile.id);
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

      // 4. Map: pick latest request per student (requests already ordered DESC)
      const latestByStudent = new Map<string, ClearanceRequest>();
      for (const req of requests) {
        if (!latestByStudent.has(req.student_id)) {
          latestByStudent.set(req.student_id, req);
        }
      }

      // 5. Build StudentWithClearance[]
      const enriched: StudentWithClearance[] = studentProfiles.map((s) => {
        const latestRequest = latestByStudent.get(s.id) ?? null;
        return {
          ...s,
          latestRequest,
          clearanceStatus: deriveStatus(latestRequest),
        };
      });

      setStudents(enriched);
    } catch (err) {
      console.error("Error loading department students:", err);
      showToast("error", "Load Failed", "Could not load students. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtimeRefresh('clearance_requests', loadData);

  // --- Computed stats ---
  const totalCount = students.length;
  const clearedCount = students.filter((s) => s.clearanceStatus === "cleared").length;
  const pendingCount = students.filter(
    (s) => s.clearanceStatus === "pending" || s.clearanceStatus === "in_progress"
  ).length;
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-cjc-navy">
              {isLoading ? "..." : totalCount}
            </p>
            <p className="text-sm text-gray-500">Total Students</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {isLoading ? "..." : clearedCount}
            </p>
            <p className="text-sm text-gray-500">Cleared</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {isLoading ? "..." : pendingCount}
            </p>
            <p className="text-sm text-gray-500">Pending / In Progress</p>
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
    </div>
  );
}
