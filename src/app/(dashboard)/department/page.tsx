"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Loader2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  FileText,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  Department,
  Profile,
  ClearanceRequest,
  getDepartmentByHeadId,
  getStudentsByDepartment,
  getClearanceRequestsByStudentIds,
  getSystemSettings,
  SystemSettings,
} from "@/lib/supabase";

interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  cleared: number;
  rejected: number;
  noRequest: number;
  rate: number;
}

interface StudentWithStatus extends Profile {
  latestRequest: ClearanceRequest | null;
  status: "cleared" | "pending" | "in_progress" | "rejected" | "none";
}

function deriveStatus(request: ClearanceRequest | null): StudentWithStatus["status"] {
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

export default function DepartmentDashboard() {
  const { profile, isLoading: authLoading } = useAuth();
  const [department, setDepartment] = useState<Department | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    cleared: 0,
    rejected: 0,
    noRequest: 0,
    rate: 0,
  });
  const [recentStudents, setRecentStudents] = useState<StudentWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setError(null);

      // Parallel fetch department and settings
      const [dept, settingsData] = await Promise.all([
        getDepartmentByHeadId(profile.id),
        getSystemSettings(),
      ]);

      if (!dept) {
        setDepartment(null);
        setStats({ total: 0, pending: 0, inProgress: 0, cleared: 0, rejected: 0, noRequest: 0, rate: 0 });
        setRecentStudents([]);
        return;
      }
      setDepartment(dept);
      setSettings(settingsData);

      // Fetch students in this department
      const students = await getStudentsByDepartment(dept.code);
      if (students.length === 0) {
        setStats({ total: 0, pending: 0, inProgress: 0, cleared: 0, rejected: 0, noRequest: 0, rate: 0 });
        setRecentStudents([]);
        return;
      }

      // Fetch clearance requests for these students
      const studentIds = students.map((s) => s.id);
      const requests = await getClearanceRequestsByStudentIds(studentIds);

      // Build map of latest request per student (requests are ordered DESC)
      const latestByStudent = new Map<string, ClearanceRequest>();
      for (const req of requests) {
        if (!latestByStudent.has(req.student_id)) {
          latestByStudent.set(req.student_id, req);
        }
      }

      // Calculate stats and enrich students
      let cleared = 0;
      let pending = 0;
      let inProgress = 0;
      let rejected = 0;
      let noRequest = 0;

      const enrichedStudents: StudentWithStatus[] = students.map((student) => {
        const req = latestByStudent.get(student.id) ?? null;
        const status = deriveStatus(req);

        switch (status) {
          case "cleared":
            cleared++;
            break;
          case "pending":
            pending++;
            break;
          case "in_progress":
            inProgress++;
            break;
          case "rejected":
            rejected++;
            break;
          default:
            noRequest++;
        }

        return { ...student, latestRequest: req, status };
      });

      const total = students.length;
      const rate = total > 0 ? (cleared / total) * 100 : 0;

      setStats({ total, pending, inProgress, cleared, rejected, noRequest, rate });

      // Get recent students with activity (sorted by latest request date)
      const studentsWithRequests = enrichedStudents
        .filter((s) => s.latestRequest)
        .sort((a, b) => {
          const dateA = new Date(a.latestRequest!.created_at).getTime();
          const dateB = new Date(b.latestRequest!.created_at).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);

      setRecentStudents(studentsWithRequests);
    } catch (err) {
      console.error("Error loading department stats:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.id) {
      setIsLoading(false);
      return;
    }
    loadStats();
  }, [authLoading, profile?.id, loadStats]);

  // Real-time updates when clearance requests change
  useRealtimeRefresh("clearance_requests", loadStats);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
  };

  const progressPercent = stats.total > 0 ? Math.round((stats.cleared / stats.total) * 100) : 0;

  const getStatusBadge = (status: StudentWithStatus["status"]) => {
    switch (status) {
      case "cleared":
        return <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3" /> Cleared</Badge>;
      case "pending":
        return <Badge variant="neutral" size="sm"><Clock className="w-3 h-3" /> Not Started</Badge>;
      case "in_progress":
        return <Badge variant="warning" size="sm"><Clock className="w-3 h-3" /> In Progress</Badge>;
      case "rejected":
        return <Badge variant="danger" size="sm"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      default:
        return <Badge variant="neutral" size="sm">No Request</Badge>;
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">Department</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Department Dashboard
            </h1>
          </div>
        </header>
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">{department?.name ?? "Department"}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Department Dashboard
            </h1>
          </div>
        </header>
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-cjc-navy mb-1">Error Loading Dashboard</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button variant="secondary" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-warm-muted">{department?.name ?? "Department"}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Department Dashboard
            </h1>
            {settings && (
              <p className="text-xs text-gray-400 mt-1">
                {settings.current_semester} Semester, A.Y. {settings.academic_year}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-1"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card p-4 text-center">
            <Users className="w-8 h-8 text-cjc-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.total}</p>
            <p className="text-sm text-warm-muted">Total Students</p>
          </div>
          <div className="card p-4 text-center">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.pending}</p>
            <p className="text-sm text-warm-muted">Not Started</p>
          </div>
          <div className="card p-4 text-center">
            <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.inProgress}</p>
            <p className="text-sm text-warm-muted">In Progress</p>
          </div>
          <div className="card p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.cleared}/{stats.total}</p>
            <p className="text-sm text-warm-muted">Cleared</p>
            {stats.total > 0 && (
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
          <div className="card p-4 text-center">
            <TrendingUp className="w-8 h-8 text-ccis-blue-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.rate.toFixed(1)}%</p>
            <p className="text-sm text-warm-muted">Clearance Rate</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Student Clearance Overview</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-lg font-bold text-green-700">{stats.cleared}</p>
                <p className="text-xs text-green-600">Cleared</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-lg font-bold text-gray-700">{stats.pending}</p>
                <p className="text-xs text-gray-500">Not Started</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-lg font-bold text-amber-700">{stats.inProgress}</p>
                <p className="text-xs text-amber-600">In Progress</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-lg font-bold text-red-700">{stats.rejected}</p>
                <p className="text-xs text-red-600">Rejected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-lg font-bold text-gray-700">{stats.noRequest}</p>
                <p className="text-xs text-gray-500">No Request</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Student Activity */}
        <Card padding="md">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Student Activity</CardTitle>
            <Link href="/department/students">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          {recentStudents.length > 0 ? (
            <div className="space-y-3">
              {recentStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={student.avatar_url ?? undefined}
                      name={`${student.first_name} ${student.last_name}`}
                      size="sm"
                      variant="primary"
                    />
                    <div>
                      <p className="font-medium text-cjc-navy text-sm">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {student.student_id ?? "No ID"} • {student.course ?? "N/A"}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(student.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No recent student activity</p>
              <p className="text-xs text-gray-400 mt-1">
                Students will appear here when they submit clearance requests
              </p>
            </div>
          )}
        </Card>

        {/* Department Info Footer */}
        <div className="flex flex-wrap gap-2 justify-center text-sm text-warm-muted">
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {department?.code ?? "N/A"}
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {profile?.role === "department" ? "Department Head" : "Staff"}
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {stats.total} Students
          </span>
        </div>
      </div>
    </div>
  );
}
