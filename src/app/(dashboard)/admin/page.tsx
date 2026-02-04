"use client";

import Link from "next/link";
import {
  Users,
  Building2,
  Shield,
  Activity,
  ChevronRight,
  Server,
  Database,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Settings,
  UserPlus,
  FolderPlus,
  Megaphone,
} from "lucide-react";
import { mockUsers, activityLog, departments, dashboardStats } from "@/lib/mock-data";

export default function AdminDashboard() {
  const user = mockUsers.admin;

  const systemHealth = {
    serverStatus: "operational",
    databaseStatus: "operational",
    storageUsed: 67,
    cpuLoad: 23,
    uptime: "99.9%",
  };

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">System Administration</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">
            Admin Dashboard
          </h1>
        </div>
      </header>

      <div className="p-6">
        {/* System Status */}
        <div className="card p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <div>
                <h2 className="font-display font-bold text-cjc-navy">All Systems Operational</h2>
                <p className="text-sm text-warm-muted">Uptime: {systemHealth.uptime} · Last checked: Just now</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/5 border border-success/20">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs font-medium text-success">Server Online</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/5 border border-success/20">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs font-medium text-success">Database Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <div className="w-10 h-10 rounded-lg bg-cjc-blue/10 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-cjc-blue" />
            </div>
            <p className="text-3xl font-bold text-cjc-navy">
              {(dashboardStats.totalStudents + 156).toLocaleString()}
            </p>
            <p className="text-sm text-warm-muted">Total Users</p>
          </div>

          <div className="card p-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-bold text-cjc-navy">{departments.length}</p>
            <p className="text-sm text-warm-muted">Departments</p>
          </div>

          <div className="card p-4">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
              <Activity className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-cjc-navy">{activityLog.length * 100}+</p>
            <p className="text-sm text-warm-muted">Activities Today</p>
          </div>

          <div className="card p-4">
            <div className="w-10 h-10 rounded-lg bg-pending/10 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-pending" />
            </div>
            <p className="text-3xl font-bold text-cjc-navy">{systemHealth.uptime}</p>
            <p className="text-sm text-warm-muted">System Uptime</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-cjc-navy">Recent Activity</h2>
                <Link
                  href="/admin/logs"
                  className="text-sm text-cjc-blue font-medium hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {activityLog.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-surface-warm"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.action === "approved"
                          ? "bg-success/10 text-success"
                          : activity.action === "rejected"
                          ? "bg-danger/10 text-danger"
                          : activity.action === "put_on_hold"
                          ? "bg-warning/10 text-warning"
                          : "bg-cjc-blue/10 text-cjc-blue"
                      }`}
                    >
                      {activity.action === "approved" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : activity.action === "put_on_hold" ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-cjc-navy">{activity.userName}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          activity.userRole === "admin" ? "bg-danger/10 text-danger" :
                          activity.userRole === "office" ? "bg-success/10 text-success" :
                          activity.userRole === "academic-club" ? "bg-cjc-blue/10 text-cjc-blue" :
                          activity.userRole === "non-academic-club" ? "bg-pending/10 text-pending" :
                          "bg-cjc-gold/10 text-cjc-gold"
                        }`}>
                          {activity.userRole}
                        </span>
                      </div>
                      <p className="text-sm text-warm-muted mt-0.5">{activity.details}</p>
                      <p className="text-xs text-warm-muted/60 mt-1">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card p-4">
              <h3 className="font-display font-bold text-cjc-navy mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 p-3 rounded-lg bg-cjc-blue/5 border border-cjc-blue/20 hover:bg-cjc-blue/10 transition-colors"
                >
                  <UserPlus className="w-5 h-5 text-cjc-blue" />
                  <span className="text-sm font-medium text-cjc-navy">Add New User</span>
                  <ChevronRight className="w-4 h-4 text-warm-muted ml-auto" />
                </Link>
                <Link
                  href="/admin/departments"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-warm transition-colors"
                >
                  <FolderPlus className="w-5 h-5 text-warning" />
                  <span className="text-sm font-medium text-cjc-navy">Add Department</span>
                  <ChevronRight className="w-4 h-4 text-warm-muted ml-auto" />
                </Link>
                <Link
                  href="/admin/announcements"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-warm transition-colors"
                >
                  <Megaphone className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium text-cjc-navy">Create Announcement</span>
                  <ChevronRight className="w-4 h-4 text-warm-muted ml-auto" />
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-warm transition-colors"
                >
                  <Settings className="w-5 h-5 text-warm-muted" />
                  <span className="text-sm font-medium text-cjc-navy">System Settings</span>
                  <ChevronRight className="w-4 h-4 text-warm-muted ml-auto" />
                </Link>
              </div>
            </div>

            {/* System Resources */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-5 h-5 text-cjc-gold" />
                <h3 className="font-display font-bold text-cjc-navy">System Resources</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-warm-muted" />
                      <span className="text-sm text-cjc-navy">Storage</span>
                    </div>
                    <span className="text-sm font-medium text-cjc-navy">{systemHealth.storageUsed}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${systemHealth.storageUsed}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-warm-muted" />
                      <span className="text-sm text-cjc-navy">CPU Load</span>
                    </div>
                    <span className="text-sm font-medium text-cjc-navy">{systemHealth.cpuLoad}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill bg-success" style={{ width: `${systemHealth.cpuLoad}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-warm-muted" />
                    <span className="text-sm text-cjc-navy">Database</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">
                    Healthy
                  </span>
                </div>
              </div>
            </div>

            {/* Users by Role */}
            <div className="card p-4">
              <h3 className="font-display font-bold text-cjc-navy mb-3">Users by Role</h3>
              <div className="space-y-2">
                {[
                  { role: "Students", count: "5,234" },
                  { role: "Approvers", count: "45" },
                  { role: "Officers", count: "18" },
                  { role: "Deans", count: "6" },
                  { role: "Admins", count: "3" },
                ].map((item) => (
                  <div key={item.role} className="flex items-center justify-between py-2">
                    <span className="text-sm text-warm-muted">{item.role}</span>
                    <span className="text-sm font-bold text-cjc-navy">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
