"use client";

import { useState } from "react";
import {
  Activity,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  PauseCircle,
  User,
  Calendar,
} from "lucide-react";
import { activityLog } from "@/lib/mock-data";

export default function AdminLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const actionOptions = [
    { value: "", label: "All Actions" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "put_on_hold", label: "Put on Hold" },
    { value: "submitted", label: "Submitted" },
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case "approved": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "rejected": return <XCircle className="w-4 h-4 text-danger" />;
      case "put_on_hold": return <PauseCircle className="w-4 h-4 text-warning" />;
      default: return <Activity className="w-4 h-4 text-cjc-blue" />;
    }
  };

  const filteredLogs = activityLog.filter((log) => {
    const matchesSearch = log.userName.toLowerCase().includes(searchQuery.toLowerCase()) || log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">View system activity history</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">System Logs</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-navy">{activityLog.length * 100}+</p>
            <p className="text-sm text-warm-muted">Total Logs</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {activityLog.filter(l => l.action === "approved").length * 50}
            </p>
            <p className="text-sm text-warm-muted">Approvals</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-danger">
              {activityLog.filter(l => l.action === "rejected").length * 10}
            </p>
            <p className="text-sm text-warm-muted">Rejections</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              {activityLog.filter(l => l.action === "put_on_hold").length * 15}
            </p>
            <p className="text-sm text-warm-muted">On Hold</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
            <input
              placeholder="Search by user or action..."
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
              {actionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary">
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>

        {/* Activity Log */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-cjc-gold" />
            <h3 className="font-display font-bold text-cjc-navy">Activity Log</h3>
          </div>

          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-surface-warm"
              >
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-border-warm">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-cjc-navy">{log.userName}</p>
                      <p className="text-sm text-warm-muted mt-0.5">{log.details}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      log.action === "approved" ? "bg-success/10 text-success" :
                      log.action === "rejected" ? "bg-danger/10 text-danger" :
                      log.action === "put_on_hold" ? "bg-warning/10 text-warning" :
                      "bg-cjc-blue/10 text-cjc-blue"
                    }`}>
                      {log.action.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-warm-muted">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.userRole}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-warm-muted mx-auto mb-3" />
              <p className="text-warm-muted">No logs found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-warm-muted">
            Showing {filteredLogs.length} logs
          </p>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary text-sm py-2" disabled>Previous</button>
            <button className="btn btn-secondary text-sm py-2">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
