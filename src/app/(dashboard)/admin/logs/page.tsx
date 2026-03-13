"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Upload,
  User,
  Calendar,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getAdminLogs, AdminLogEntry } from "@/lib/supabase";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/Button";

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "on_hold", label: "On Hold" },
  { value: "submitted", label: "Submitted" },
  { value: "pending", label: "Reset to Pending" },
];

function getActionIcon(action: string) {
  switch (action) {
    case "approved":
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case "rejected":
      return <XCircle className="w-4 h-4 text-danger" />;
    case "on_hold":
      return <PauseCircle className="w-4 h-4 text-warning" />;
    case "submitted":
      return <Upload className="w-4 h-4 text-cjc-blue" />;
    default:
      return <Activity className="w-4 h-4 text-gray-400" />;
  }
}

function actionLabel(status: string) {
  switch (status) {
    case "on_hold":
      return "On Hold";
    case "attendance_system":
      return "Attendance";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function actionBadgeClass(status: string) {
  switch (status) {
    case "approved":
      return "bg-success/10 text-success";
    case "rejected":
      return "bg-danger/10 text-danger";
    case "on_hold":
      return "bg-warning/10 text-warning";
    case "submitted":
      return "bg-cjc-blue/10 text-cjc-blue";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

function actorName(log: AdminLogEntry): string {
  if (log.actor) {
    const name = [log.actor.first_name, log.actor.last_name]
      .filter(Boolean)
      .join(" ");
    if (name) return name;
  }
  if (log.actor_role === "attendance_system") return "Attendance System";
  return "System";
}

function studentName(log: AdminLogEntry): string {
  if (!log.student) return "Unknown Student";
  const name = [log.student.first_name, log.student.last_name]
    .filter(Boolean)
    .join(" ");
  return name || log.student.student_id || "Unknown Student";
}

function exportCsv(logs: AdminLogEntry[]) {
  const header = [
    "Date",
    "Actor",
    "Actor Role",
    "Student",
    "From Status",
    "To Status",
    "Remarks",
    "Semester",
  ].join(",");
  const rows = logs.map((l) => {
    const cols = [
      new Date(l.created_at).toLocaleString(),
      actorName(l),
      l.actor_role ?? "",
      studentName(l),
      l.from_status ?? "",
      l.to_status,
      (l.remarks ?? "").replace(/,/g, ";"),
      l.clearance_item?.request
        ? `${l.clearance_item.request.academic_year} ${l.clearance_item.request.semester}`
        : "",
    ];
    return cols.map((c) => `"${c}"`).join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clearance-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminLogs(500);
      setLogs(data);
    } catch (err) {
      console.error("Error loading logs:", err);
      setError("Failed to load logs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = logs.filter((log) => {
    const actorStr = actorName(log).toLowerCase();
    const studentStr = studentName(log).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      actorStr.includes(query) ||
      studentStr.includes(query) ||
      log.to_status.includes(query) ||
      (log.remarks ?? "").toLowerCase().includes(query);
    const matchesAction = !actionFilter || log.to_status === actionFilter;
    return matchesSearch && matchesAction;
  });

  const approvedCount = logs.filter((l) => l.to_status === "approved").length;
  const rejectedCount = logs.filter((l) => l.to_status === "rejected").length;
  const onHoldCount = logs.filter((l) => l.to_status === "on_hold").length;

  return (
    <div className="min-h-screen bg-surface-warm">
      <Header
        title="System Logs"
        subtitle="View clearance activity history"
        actions={
          <Button variant="secondary" onClick={loadLogs} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-navy">{logs.length}</p>
            <p className="text-sm text-warm-muted">Total Logs</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-success">{approvedCount}</p>
            <p className="text-sm text-warm-muted">Approvals</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-danger">{rejectedCount}</p>
            <p className="text-sm text-warm-muted">Rejections</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-warning">{onHoldCount}</p>
            <p className="text-sm text-warm-muted">On Hold</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
            <input
              placeholder="Search by actor, student, action, or remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
            />
          </div>
          <div className="w-48">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full h-10 px-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => exportCsv(filteredLogs)}
            disabled={filteredLogs.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Activity Log */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-cjc-gold" />
            <h3 className="font-display font-bold text-cjc-navy">Activity Log</h3>
            {!isLoading && (
              <span className="text-xs text-warm-muted ml-auto">
                {filteredLogs.length} entries
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-cjc-navy animate-spin" />
              <span className="ml-2 text-warm-muted">Loading logs...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-danger">{error}</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-warm-muted mx-auto mb-3" />
              <p className="text-warm-muted">No logs found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-surface-warm"
                >
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-border-warm">
                    {getActionIcon(log.to_status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-medium text-cjc-navy">
                          {actorName(log)}
                          {log.from_status && (
                            <span className="text-xs text-warm-muted font-normal ml-2">
                              {log.from_status} → {log.to_status}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-warm-muted mt-0.5">
                          Student: {studentName(log)}
                          {log.clearance_item?.request && (
                            <span className="ml-2 text-xs">
                              ({log.clearance_item.request.academic_year}{" "}
                              {log.clearance_item.request.semester})
                            </span>
                          )}
                        </p>
                        {log.remarks && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            &ldquo;{log.remarks}&rdquo;
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${actionBadgeClass(
                          log.to_status
                        )}`}
                      >
                        {actionLabel(log.to_status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-warm-muted">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.actor_role ?? "system"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
