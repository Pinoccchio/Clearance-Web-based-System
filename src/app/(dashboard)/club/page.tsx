"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Clock, Users, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  Club,
  getClubByAdviserId,
  getMembersByClub,
  getAllClearanceItemsByClub,
} from "@/lib/supabase";

export default function ClubDashboard() {
  const { profile } = useAuth();

  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    pending: 0,
    cleared: 0,
    clearanceRate: 0,
  });

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      const clubData = await getClubByAdviserId(profile.id);
      if (!clubData) {
        setClub(null);
        return;
      }
      setClub(clubData);

      // Fetch members and clearance items in parallel
      const [members, clearanceItems] = await Promise.all([
        getMembersByClub(clubData.id),
        getAllClearanceItemsByClub(clubData.id),
      ]);

      if (members.length === 0) {
        setStats({
          totalMembers: 0,
          pending: 0,
          cleared: 0,
          clearanceRate: 0,
        });
        return;
      }

      // Map clearance items by student ID (from the nested request)
      const itemsByStudent = new Map<string, typeof clearanceItems[0]>();
      for (const item of clearanceItems) {
        const studentId = item.request?.student_id;
        if (studentId && !itemsByStudent.has(studentId)) {
          itemsByStudent.set(studentId, item);
        }
      }

      // Calculate stats based on clearance item status
      let clearedCount = 0;
      let pendingCount = 0;

      for (const member of members) {
        const item = itemsByStudent.get(member.id);
        if (!item) continue; // No clearance item yet

        if (item.status === "approved") {
          clearedCount++;
        } else if (item.status === "submitted" || item.status === "on_hold" || item.status === "rejected") {
          pendingCount++;
        }
        // "pending" status means not yet submitted, so we don't count it
      }

      const clearanceRate = members.length > 0
        ? Math.round((clearedCount / members.length) * 1000) / 10
        : 0;

      setStats({
        totalMembers: members.length,
        pending: pendingCount,
        cleared: clearedCount,
        clearanceRate,
      });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time refresh when clearance items change
  useRealtimeRefresh("clearance_items", loadData);

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 text-sm text-warm-muted mb-1">
            <span>{club?.name ?? "Club"}</span>
            {club?.type && (
              <Badge variant={club.type === "academic" ? "info" : "warning"} size="sm">
                {club.type === "academic" ? "Academic" : "Non-Academic"}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">
            Club Dashboard
          </h1>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card padding="md" className="text-center">
            <Users className="w-8 h-8 text-cjc-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">
              {isLoading ? "..." : stats.totalMembers}
            </p>
            <p className="text-sm text-warm-muted">Total Members</p>
          </Card>
          <Card padding="md" className="text-center">
            <Clock className="w-8 h-8 text-pending mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">
              {isLoading ? "..." : stats.pending}
            </p>
            <p className="text-sm text-warm-muted">Pending</p>
          </Card>
          <Card padding="md" className="text-center">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">
              {isLoading ? "..." : stats.cleared}
            </p>
            <p className="text-sm text-warm-muted">Cleared</p>
          </Card>
          <Card padding="md" className="text-center">
            <TrendingUp className="w-8 h-8 text-cjc-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">
              {isLoading ? "..." : `${stats.clearanceRate}%`}
            </p>
            <p className="text-sm text-warm-muted">Clearance Rate</p>
          </Card>
        </div>

        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 rounded-full bg-cjc-blue/10 flex items-center justify-center mx-auto mb-4">
            {club?.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <Users className="w-8 h-8 text-cjc-blue" />
            )}
          </div>
          <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">
            {club?.name ?? "Club Dashboard"}
          </h2>
          <p className="text-warm-muted max-w-md mx-auto mb-4">
            Manage member clearances and view club statistics.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm text-warm-muted">
            <span className="px-3 py-1 bg-surface-warm rounded-full">{club?.code ?? "—"}</span>
            {club?.type === "academic" && club.department && (
              <span className="px-3 py-1 bg-surface-warm rounded-full">{club.department}</span>
            )}
            <span className="px-3 py-1 bg-surface-warm rounded-full">
              {club?.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
