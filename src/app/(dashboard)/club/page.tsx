"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  PauseCircle,
  FileText,
  Users,
  Loader2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  XCircle,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  Club,
  ClearanceItemWithDetails,
  getClubByAdviserId,
  getAllClearanceItemsByClub,
  getMembersByClub,
  getSystemSettings,
  SystemSettings,
} from "@/lib/supabase";

interface DashboardStats {
  totalMembers: number;
  pending: number;
  submitted: number;
  approved: number;
  onHold: number;
  rejected: number;
  totalProcessed: number;
  approvedToday: number;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>;
    case "submitted":
      return <Badge variant="pending" size="sm"><Send className="w-3 h-3" /> Submitted</Badge>;
    case "pending":
      return <Badge variant="warning" size="sm"><Clock className="w-3 h-3" /> Pending</Badge>;
    case "on_hold":
      return <Badge variant="warning" size="sm"><PauseCircle className="w-3 h-3" /> On Hold</Badge>;
    case "rejected":
      return <Badge variant="danger" size="sm"><XCircle className="w-3 h-3" /> Rejected</Badge>;
    default:
      return <Badge variant="neutral" size="sm">{status}</Badge>;
  }
}

export default function ClubDashboard() {
  const { profile, isLoading: authLoading } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    pending: 0,
    submitted: 0,
    approved: 0,
    onHold: 0,
    rejected: 0,
    totalProcessed: 0,
    approvedToday: 0,
  });
  const [recentItems, setRecentItems] = useState<ClearanceItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setError(null);

      // Parallel fetch club and settings
      const [clubData, settingsData] = await Promise.all([
        getClubByAdviserId(profile.id),
        getSystemSettings(),
      ]);

      if (!clubData) {
        setClub(null);
        setStats({
          totalMembers: 0,
          pending: 0,
          submitted: 0,
          approved: 0,
          onHold: 0,
          rejected: 0,
          totalProcessed: 0,
          approvedToday: 0,
        });
        setRecentItems([]);
        return;
      }
      setClub(clubData);
      setSettings(settingsData);

      // Fetch members and clearance items in parallel
      const [members, items] = await Promise.all([
        getMembersByClub(clubData.id),
        getAllClearanceItemsByClub(clubData.id),
      ]);

      // Filter to current period only
      const currentItems = items.filter(
        (item) =>
          item.request?.academic_year === settingsData?.academic_year &&
          item.request?.semester === settingsData?.current_semester
      );

      // Calculate stats
      let pending = 0;
      let submitted = 0;
      let approved = 0;
      let onHold = 0;
      let rejected = 0;
      let approvedToday = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const item of currentItems) {
        switch (item.status) {
          case "pending":
            pending++;
            break;
          case "submitted":
            submitted++;
            break;
          case "approved":
            approved++;
            // Check if approved today
            if (item.reviewed_at) {
              const reviewedDate = new Date(item.reviewed_at);
              reviewedDate.setHours(0, 0, 0, 0);
              if (reviewedDate.getTime() === today.getTime()) {
                approvedToday++;
              }
            }
            break;
          case "on_hold":
            onHold++;
            break;
          case "rejected":
            rejected++;
            break;
        }
      }

      const totalProcessed = approved + rejected + onHold;

      setStats({
        totalMembers: members.length,
        pending,
        submitted,
        approved,
        onHold,
        rejected,
        totalProcessed,
        approvedToday,
      });

      // Get 5 most recent items with activity (non-pending)
      const recentActivity = currentItems
        .filter((item) => item.status !== "pending")
        .slice(0, 5);

      setRecentItems(recentActivity);
    } catch (err) {
      console.error("Error loading club stats:", err);
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

  // Real-time updates when clearance items change
  useRealtimeRefresh("clearance_items", loadStats);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
  };

  const progressPercent = stats.totalProcessed > 0
    ? Math.round((stats.approved / stats.totalProcessed) * 100)
    : 0;

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">Club</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Club Dashboard
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
            <p className="text-sm text-warm-muted">{club?.name ?? "Club"}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Club Dashboard
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
            <p className="text-sm text-warm-muted">{club?.name ?? "Club"}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">
              Club Dashboard
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
            <Users className="w-8 h-8 text-cjc-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.totalMembers}</p>
            <p className="text-sm text-warm-muted">Total Members</p>
          </div>
          <div className="card p-4 text-center">
            <Clock className="w-8 h-8 text-pending mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.pending + stats.submitted}</p>
            <p className="text-sm text-warm-muted">Pending Review</p>
          </div>
          <div className="card p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.approvedToday}</p>
            <p className="text-sm text-warm-muted">Approved Today</p>
          </div>
          <div className="card p-4 text-center">
            <FileText className="w-8 h-8 text-cjc-red mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">{stats.totalProcessed}</p>
            <p className="text-sm text-warm-muted">Total Processed</p>
            {stats.totalProcessed > 0 && (
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Clearance Queue Overview</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-lg font-bold text-amber-700">{stats.pending}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-cjc-blue/5 rounded-lg">
              <Send className="w-5 h-5 text-cjc-blue" />
              <div>
                <p className="text-lg font-bold text-cjc-navy">{stats.submitted}</p>
                <p className="text-xs text-cjc-blue">Submitted</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-lg font-bold text-green-700">{stats.approved}</p>
                <p className="text-xs text-green-600">Approved</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <PauseCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-lg font-bold text-orange-700">{stats.onHold}</p>
                <p className="text-xs text-orange-600">On Hold</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-lg font-bold text-red-700">{stats.rejected}</p>
                <p className="text-xs text-red-600">Rejected</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card padding="md">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/club/clearance">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          {recentItems.length > 0 ? (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={item.request?.student?.avatar_url ?? undefined}
                      name={item.request?.student ? `${item.request.student.first_name} ${item.request.student.last_name}` : "Unknown"}
                      size="sm"
                      variant="primary"
                    />
                    <div>
                      <p className="font-medium text-cjc-navy text-sm">
                        {item.request?.student
                          ? `${item.request.student.first_name} ${item.request.student.last_name}`
                          : "Unknown Student"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.request?.student?.student_id ?? "No ID"}
                        {item.reviewed_at && ` • ${new Date(item.reviewed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No recent clearance activity</p>
              <p className="text-xs text-gray-400 mt-1">
                Activity will appear here when you review clearance requests
              </p>
            </div>
          )}
        </Card>

        {/* Club Info Footer */}
        <div className="flex flex-wrap gap-2 justify-center text-sm text-warm-muted">
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {club?.code ?? "N/A"}
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {club?.type === "academic" ? "Academic Club" : "Non-Academic Club"}
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {profile?.role === "club" ? "Club Adviser" : "Staff"}
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full">
            {stats.pending + stats.submitted} Awaiting Review
          </span>
        </div>
      </div>
    </div>
  );
}
