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
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  CspsgDivision,
  Profile,
  ClearanceRequest,
  ClearanceItem,
  getCspsgDivisionByHeadId,
  getStudentsByDivision,
  getClearanceRequestsByStudentIds,
  getClearanceItemsBySourceAndRequests,
  getSystemSettings,
  SystemSettings,
} from "@/lib/supabase";

type ClearanceStatus = "completed" | "in_progress" | "pending" | "none";

interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  noRequest: number;
  rate: number;
}

interface StudentWithStatus extends Profile {
  latestRequest: ClearanceRequest | null;
  deptItem: ClearanceItem | null;
  status: ClearanceStatus;
}

function deriveOverallStatus(request: ClearanceRequest | null): ClearanceStatus {
  if (!request) return "none";
  return request.status as ClearanceStatus;
}

export default function CspsgDivisionDashboard() {
  const { profile, isLoading: authLoading } = useAuth();
  const [division, setDivision] = useState<CspsgDivision | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
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

      // Parallel fetch division and settings
      const [div, settingsData] = await Promise.all([
        getCspsgDivisionByHeadId(profile.id),
        getSystemSettings(),
      ]);

      const emptyStats: DashboardStats = { total: 0, completed: 0, inProgress: 0, pending: 0, noRequest: 0, rate: 0 };

      if (!div) {
        setDivision(null);
        setStats(emptyStats);
        setRecentStudents([]);
        return;
      }
      setDivision(div);
      setSettings(settingsData);

      // Fetch students in this division
      const students = await getStudentsByDivision(div.code);
      if (students.length === 0) {
        setStats(emptyStats);
        setRecentStudents([]);
        return;
      }

      // Fetch clearance requests for these students
      const studentIds = students.map((s) => s.id);
      const requests = await getClearanceRequestsByStudentIds(studentIds);

      // Filter to current period only
      const currentRequests = requests.filter(
        (req) =>
          req.academic_year === settingsData?.academic_year &&
          req.semester === settingsData?.current_semester
      );

      // Build map of latest request per student (requests are ordered DESC)
      const latestByStudent = new Map<string, ClearanceRequest>();
      for (const req of currentRequests) {
        if (!latestByStudent.has(req.student_id)) {
          latestByStudent.set(req.student_id, req);
        }
      }

      // Fetch division-specific clearance items for these requests
      const requestIds = currentRequests.map((r) => r.id);
      const divItems = await getClearanceItemsBySourceAndRequests('cspsg_division', div.id, requestIds);

      // Map items by request_id for quick lookup
      const itemByRequest = new Map<string, ClearanceItem>();
      for (const item of divItems) {
        itemByRequest.set(item.request_id, item);
      }

      // Calculate stats and enrich students using overall request status
      let completed = 0;
      let inProgress = 0;
      let pending = 0;
      let noRequest = 0;

      const enrichedStudents: StudentWithStatus[] = students.map((student) => {
        const req = latestByStudent.get(student.id) ?? null;
        const deptItem = req ? itemByRequest.get(req.id) ?? null : null;
        const status = deriveOverallStatus(req);

        switch (status) {
          case "completed":
            completed++;
            break;
          case "in_progress":
            inProgress++;
            break;
          case "pending":
            pending++;
            break;
          default:
            noRequest++;
        }

        return { ...student, latestRequest: req, deptItem, status };
      });

      const total = students.length;
      const rate = total > 0 ? (completed / total) * 100 : 0;

      setStats({ total, completed, inProgress, pending, noRequest, rate });

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
      console.error("Error loading division stats:", err);
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

  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const getStatusBadge = (status: StudentWithStatus["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3" /> Completed</Badge>;
      case "in_progress":
        return <Badge variant="warning" size="sm"><Clock className="w-3 h-3" /> In Progress</Badge>;
      case "pending":
        return <Badge variant="neutral" size="sm"><Clock className="w-3 h-3" /> Pending</Badge>;
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
            <p className="text-sm text-warm-muted">CSPSG Division</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Division Dashboard
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
            <p className="text-sm text-warm-muted">{division?.name ?? "CSPSG Division"}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Division Dashboard
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
            <p className="text-sm text-warm-muted">{division?.name ?? "CSPSG Division"}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Division Dashboard
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="card p-4 text-center">
            <Users className="w-8 h-8 text-cjc-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.total}</p>
            <p className="text-sm text-warm-muted">Total Students</p>
          </div>
          <div className="card p-4 text-center">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.pending}</p>
            <p className="text-sm text-warm-muted">Pending</p>
          </div>
          <div className="card p-4 text-center">
            <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.inProgress}</p>
            <p className="text-sm text-warm-muted">In Progress</p>
          </div>
          <div className="card p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.completed}/{stats.total}</p>
            <p className="text-sm text-warm-muted">Completed</p>
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
            <TrendingUp className="w-8 h-8 text-cjc-red mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.rate.toFixed(1)}%</p>
            <p className="text-sm text-warm-muted">Completion Rate</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Student Clearance Overview</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-lg font-bold text-green-700">{stats.completed}</p>
                <p className="text-xs text-green-600">Completed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-cjc-blue/5 rounded-lg">
              <Clock className="w-5 h-5 text-cjc-blue" />
              <div>
                <p className="text-lg font-bold text-cjc-navy">{stats.inProgress}</p>
                <p className="text-xs text-cjc-blue">In Progress</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-lg font-bold text-gray-700">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
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
            <Link href="/cspsg-division/students">
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

        {/* Division Info Footer */}
        <div className="flex flex-wrap gap-2 justify-center text-sm text-warm-muted">
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {division?.code ?? "N/A"}
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {profile?.role === "cspsg_division" ? "Division Head" : "Staff"}
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {stats.total} Students
          </span>
        </div>
      </div>
    </div>
  );
}
