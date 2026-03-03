"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Users,
  GraduationCap,
  ArrowRight,
  Loader2,
  RefreshCw,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import {
  getClearanceItemsForStudent,
  getAllOffices,
  getAllClubs,
  getSystemSettings,
  getDepartmentByCode,
  ClearanceItem,
  ClearanceRequest,
  OfficeWithHead,
  ClubWithAdviser,
  SystemSettings,
  Department,
} from "@/lib/supabase";

type ItemStatus = ClearanceItem["status"];

interface ClearanceItemWithRequest extends ClearanceItem {
  request: ClearanceRequest;
}

export default function StudentDashboardPage() {
  const { profile, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<ClearanceItemWithRequest[]>([]);
  const [studentDept, setStudentDept] = useState<Department | null>(null);
  const [offices, setOffices] = useState<OfficeWithHead[]>([]);
  const [clubs, setClubs] = useState<ClubWithAdviser[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setError(null);
      const [itemsData, deptsData, officesData, clubsData, settingsData] = await Promise.all([
        getClearanceItemsForStudent(profile.id),
        profile.department ? getDepartmentByCode(profile.department) : Promise.resolve(null),
        getAllOffices(),
        getAllClubs(),
        getSystemSettings(),
      ]);

      setItems(itemsData as ClearanceItemWithRequest[]);
      setStudentDept(deptsData);
      setOffices(officesData.filter((o) => o.status === "active"));
      setClubs(clubsData.filter((c) => c.status === "active"));
      setSettings(settingsData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile?.id, profile?.department]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.id) {
      setIsLoading(false);
      return;
    }
    loadData();
  }, [authLoading, profile?.id, loadData]);

  useRealtimeRefresh("clearance_items", loadData);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  // Parse enrolled clubs from profile
  const enrolledClubIds = profile?.enrolled_clubs
    ? profile.enrolled_clubs.split(",").map((c) => c.trim()).filter(Boolean)
    : [];
  const enrolledClubs = clubs.filter((c) => enrolledClubIds.includes(c.id));

  // Calculate stats
  const clearedCount = items.filter((i) => i.status === "approved").length;
  const pendingReviewCount = items.filter((i) => i.status === "submitted").length;
  const rejectedCount = items.filter((i) => i.status === "rejected").length;
  const onHoldCount = items.filter((i) => i.status === "on_hold").length;
  const actionRequiredCount = rejectedCount + onHoldCount;

  // Total sources: 1 department + all offices + enrolled clubs
  const totalSources = (studentDept ? 1 : 0) + offices.length + enrolledClubs.length;

  // Build source name lookup map
  const sourceNameMap: Record<string, string> = {};
  if (studentDept) {
    sourceNameMap[`department:${studentDept.id}`] = studentDept.name;
  }
  for (const o of offices) {
    sourceNameMap[`office:${o.id}`] = o.name;
  }
  for (const c of clubs) {
    sourceNameMap[`club:${c.id}`] = c.name;
  }

  // Group items by source_type for display
  const getItemsForSource = (sourceType: string, sourceId: string) => {
    return items.find(
      (i) => i.source_type === sourceType && i.source_id === sourceId
    );
  };

  const getStatusBadge = (status: ItemStatus | undefined) => {
    if (!status || status === "pending") {
      return <Badge variant="neutral" size="sm">Not Started</Badge>;
    }
    switch (status) {
      case "submitted":
        return <Badge variant="warning" size="sm">Pending Review</Badge>;
      case "approved":
        return <Badge variant="success" size="sm">Cleared</Badge>;
      case "rejected":
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      case "on_hold":
        return <Badge variant="onHold" size="sm">On Hold</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Unknown</Badge>;
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">Welcome back</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Student Dashboard
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
            <p className="text-sm text-warm-muted">Welcome back, {profile?.first_name ?? "Student"}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Student Dashboard
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

  // Calculate progress percentage
  const progressPercent = totalSources > 0 ? Math.round((clearedCount / totalSources) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-warm-muted">Welcome back, {profile?.first_name ?? "Student"}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Student Dashboard
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{clearedCount}/{totalSources}</p>
            <p className="text-sm text-warm-muted">Cleared</p>
            {totalSources > 0 && (
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
          <div className="card p-4 text-center">
            <Clock className="w-8 h-8 text-pending mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{pendingReviewCount}</p>
            <p className="text-sm text-warm-muted">Pending Review</p>
          </div>
          <div className="card p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{actionRequiredCount}</p>
            <p className="text-sm text-warm-muted">Action Required</p>
          </div>
          <div className="card p-4 text-center">
            <FileText className="w-8 h-8 text-cjc-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{totalSources}</p>
            <p className="text-sm text-warm-muted">Total Sources</p>
          </div>
        </div>

        {/* Clearance Status Section */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Clearance Status</CardTitle>
          </CardHeader>

          <div className="space-y-4">
            {/* Department */}
            {studentDept && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <GraduationCap className="w-4 h-4" />
                  Department
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-cjc-navy text-sm">{studentDept.name}</p>
                    <p className="text-xs text-gray-400">{studentDept.code}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(getItemsForSource("department", studentDept.id)?.status)}
                    <Link href="/student/department/submit">
                      <ArrowRight className="w-4 h-4 text-gray-400 hover:text-cjc-navy transition-colors" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Offices */}
            {offices.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <Building2 className="w-4 h-4" />
                  Offices ({offices.length})
                </div>
                <div className="space-y-2">
                  {offices.map((office) => (
                    <div key={office.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-cjc-navy text-sm">{office.name}</p>
                        <p className="text-xs text-gray-400">{office.code}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(getItemsForSource("office", office.id)?.status)}
                        <Link href="/student/offices/submit">
                          <ArrowRight className="w-4 h-4 text-gray-400 hover:text-cjc-navy transition-colors" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clubs */}
            {enrolledClubs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <Users className="w-4 h-4" />
                  Clubs ({enrolledClubs.length})
                </div>
                <div className="space-y-2">
                  {enrolledClubs.map((club) => (
                    <div key={club.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-cjc-navy text-sm">{club.name}</p>
                        <p className="text-xs text-gray-400">{club.code}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(getItemsForSource("club", club.id)?.status)}
                        <Link href="/student/clubs/submit">
                          <ArrowRight className="w-4 h-4 text-gray-400 hover:text-cjc-navy transition-colors" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalSources === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No clearance sources found.</p>
                <p className="text-xs text-gray-400 mt-1">Contact your administrator if this is unexpected.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/student/requirements">
              <Button variant="secondary" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                View Requirements
              </Button>
            </Link>
            <Link href="/student/department/submit">
              <Button variant="ccisPrimary" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Submit Clearance
              </Button>
            </Link>
            <Link href="/student/history">
              <Button variant="secondary" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                View History
              </Button>
            </Link>
          </div>
        </Card>

        {/* Student Info Footer */}
        <div className="flex flex-wrap gap-2 justify-center text-sm text-warm-muted">
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {profile?.department ?? "No Department"}
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {profile?.course ?? "No Course"}
          </span>
          {profile?.year_level && (
            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
              Year {profile.year_level}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
