"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Calendar,
  RefreshCw,
  Loader2,
  CheckCircle,
  LogIn,
  LogOut,
  Building2,
  GraduationCap,
  Users,
  ChevronDown,
  Shield,
} from "lucide-react";
import {
  getStudentAttendanceWithEvents,
  getAllDepartments,
  getAllOffices,
  getAllClubs,
  getAllCsgDepartmentLgus,
  getAllCspsgDivisions,
  getAllCsg,
  getAllCspsg,
  StudentAttendanceWithEvent,
} from "@/lib/supabase";

interface GroupedEvent {
  event: StudentAttendanceWithEvent["event"];
  logIn: StudentAttendanceWithEvent | null;
  logOut: StudentAttendanceWithEvent | null;
}

export default function StudentEventsPage() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<StudentAttendanceWithEvent[]>([]);
  const [sourceNames, setSourceNames] = useState<Record<string, { name: string; code: string; logo_url: string | null }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [attendance, depts, offices, clubs, csgDepartmentLgus, cspsgDivisions, csgs, cspsgs] = await Promise.all([
        getStudentAttendanceWithEvents(profile.id),
        getAllDepartments(),
        getAllOffices(),
        getAllClubs(),
        getAllCsgDepartmentLgus(),
        getAllCspsgDivisions(),
        getAllCsg(),
        getAllCspsg(),
      ]);

      const names: Record<string, { name: string; code: string; logo_url: string | null }> = {};
      for (const d of depts) names[d.id] = { name: d.name, code: d.code, logo_url: d.logo_url ?? null };
      for (const o of offices) names[o.id] = { name: o.name, code: o.code, logo_url: o.logo_url ?? null };
      for (const c of clubs) names[c.id] = { name: c.name, code: c.code, logo_url: c.logo_url ?? null };
      for (const l of csgDepartmentLgus) names[l.id] = { name: l.name, code: l.code, logo_url: l.logo_url ?? null };
      for (const d of cspsgDivisions) names[d.id] = { name: d.name, code: d.code, logo_url: d.logo_url ?? null };
      for (const c of csgs) names[c.id] = { name: c.name, code: c.code, logo_url: c.logo_url ?? null };
      for (const c of cspsgs) names[c.id] = { name: c.name, code: c.code, logo_url: c.logo_url ?? null };
      setSourceNames(names);
      setRecords(attendance);
    } catch (err) {
      console.error("Error loading attendance:", err);
      setError("Failed to load attendance records. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group records by event_id
  const grouped: GroupedEvent[] = [];
  const eventMap = new Map<string, GroupedEvent>();
  for (const rec of records) {
    let entry = eventMap.get(rec.event_id);
    if (!entry) {
      entry = { event: rec.event, logIn: null, logOut: null };
      eventMap.set(rec.event_id, entry);
      grouped.push(entry);
    }
    if (rec.attendance_type === "log_in") entry.logIn = rec;
    if (rec.attendance_type === "log_out") entry.logOut = rec;
  }

  // Sort by event_date desc
  grouped.sort((a, b) => new Date(b.event.event_date).getTime() - new Date(a.event.event_date).getTime());

  // Group events by source org (source_type + source_id)
  const orgGroups: { key: string; sourceType: string; sourceId: string; events: GroupedEvent[] }[] = [];
  const orgGroupMap = new Map<string, (typeof orgGroups)[number]>();
  for (const g of grouped) {
    const key = `${g.event.source_type}:${g.event.source_id}`;
    let group = orgGroupMap.get(key);
    if (!group) {
      group = { key, sourceType: g.event.source_type, sourceId: g.event.source_id, events: [] };
      orgGroupMap.set(key, group);
      orgGroups.push(group);
    }
    group.events.push(g);
  }

  const totalEvents = grouped.length;
  const totalLogIns = grouped.filter((g) => g.logIn).length;
  const totalComplete = grouped.filter((g) => g.logIn && g.logOut).length;

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="My Events & Attendance"
        subtitle="Events you have attended and your attendance records"
        actions={
          <Button variant="secondary" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-cjc-navy">{totalEvents}</p>
              <p className="text-sm text-gray-500">Total Events</p>
            </Card>
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-green-600">{totalLogIns}</p>
              <p className="text-sm text-gray-500">Log-ins</p>
            </Card>
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-cjc-blue">{totalComplete}</p>
              <p className="text-sm text-gray-500">Complete (In & Out)</p>
            </Card>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-cjc-navy animate-spin" />
            <span className="ml-3 text-gray-600">Loading attendance...</span>
          </div>
        ) : error ? (
          <Card padding="lg" className="text-center">
            <p className="text-red-600">{error}</p>
          </Card>
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-8 h-8 text-gray-400" />}
            title="No Attendance Records"
            description="Once you attend events and get scanned, your attendance will appear here."
          />
        ) : (
          <div className="space-y-6">
            {orgGroups.map((group) => {
              const org = sourceNames[group.sourceId];
              const FallbackIcon =
                group.sourceType === "office"
                  ? Building2
                  : group.sourceType === "department"
                  ? GraduationCap
                  : group.sourceType === "csg_department_lgu"
                  ? Shield
                  : group.sourceType === "cspsg_division"
                  ? GraduationCap
                  : Users;
              const fallbackBg =
                group.sourceType === "office"
                  ? "bg-blue-100 text-blue-600"
                  : group.sourceType === "department"
                  ? "bg-amber-100 text-amber-600"
                  : group.sourceType === "csg_department_lgu"
                  ? "bg-purple-100 text-purple-600"
                  : group.sourceType === "cspsg_division"
                  ? "bg-teal-100 text-teal-600"
                  : "bg-green-100 text-green-600";

              const isExpanded = expandedOrgs.has(group.key);
              const toggleExpanded = () => {
                setExpandedOrgs((prev) => {
                  const next = new Set(prev);
                  if (next.has(group.key)) next.delete(group.key);
                  else next.add(group.key);
                  return next;
                });
              };

              return (
                <div key={group.key}>
                  {/* Org Header — clickable toggle */}
                  <button
                    onClick={toggleExpanded}
                    className="flex items-center gap-3 w-full text-left cursor-pointer rounded-lg p-2 -ml-2 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {org?.logo_url ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden">
                          <img
                            src={org.logo_url}
                            alt={org.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${fallbackBg}`}>
                          <FallbackIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-cjc-navy text-sm">
                        {org ? `${org.code} — ${org.name}` : group.sourceId}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {group.sourceType} · {group.events.length} event{group.events.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Events under this org — collapsible */}
                  {isExpanded && (
                    <div className="space-y-2 ml-[52px] mt-2">
                      {group.events.map((g) => (
                        <Card key={g.event.id} padding="md">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <p className="font-semibold text-cjc-navy text-sm">{g.event.name}</p>
                              {g.event.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{g.event.description}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {new Date(g.event.event_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {g.logIn && (
                              <Badge variant="approved" size="sm">
                                <CheckCircle className="w-3 h-3" />
                                Logged In · {formatTime(g.logIn.scanned_at)}
                              </Badge>
                            )}
                            {g.logOut && (
                              <Badge variant="info" size="sm">
                                <LogOut className="w-3 h-3" />
                                Logged Out · {formatTime(g.logOut.scanned_at)}
                              </Badge>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
