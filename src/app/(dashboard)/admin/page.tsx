"use client";

import Link from "next/link";
import Header from "@/components/layout/header";
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
} from "lucide-react";
import { mockUsers, activityLog, departments, dashboardStats } from "@/lib/mock-data";

export default function AdminDashboard() {
  const user = mockUsers.admin;

  // System health mock data
  const systemHealth = {
    serverStatus: "operational",
    databaseStatus: "operational",
    storageUsed: 67,
    cpuLoad: 23,
    uptime: "99.9%",
  };

  return (
    <div>
      <Header
        title="Admin Dashboard"
        subtitle="System Administration"
      />

      <div className="p-6 space-y-6">
        {/* System Status Banner */}
        <div className="card-glass p-6 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                <Shield className="w-7 h-7 text-success" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-cjc-navy">
                  All Systems Operational
                </h2>
                <p className="text-cjc-navy/60">
                  Uptime: {systemHealth.uptime} • Last checked: Just now
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 text-success text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Server Online
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 text-success text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Database Online
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up delay-100">
          <div className="card-accent p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cjc-blue/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-cjc-blue" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              {(dashboardStats.totalStudents + 156).toLocaleString()}
            </p>
            <p className="text-sm text-cjc-navy/60">Total Users</p>
          </div>

          <div className="card-accent p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cjc-gold/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cjc-gold" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              {departments.length}
            </p>
            <p className="text-sm text-cjc-navy/60">Departments</p>
          </div>

          <div className="card-accent p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              {activityLog.length * 100}+
            </p>
            <p className="text-sm text-cjc-navy/60">Activities Today</p>
          </div>

          <div className="card-accent p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-pending/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-pending" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              {systemHealth.uptime}
            </p>
            <p className="text-sm text-cjc-navy/60">System Uptime</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 card-glass p-6 animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-cjc-navy">
                Recent Activity
              </h3>
              <Link
                href="/admin/logs"
                className="text-sm text-cjc-blue font-medium hover:text-cjc-blue-soft flex items-center gap-1"
              >
                View All Logs
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {activityLog.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                      <CheckCircle2 className="w-5 h-5" />
                    ) : activity.action === "put_on_hold" ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Activity className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cjc-navy">
                      {activity.userName}
                    </p>
                    <p className="text-sm text-cjc-navy/60 mt-0.5">
                      {activity.details}
                    </p>
                    <p className="text-xs text-cjc-navy/40 mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      activity.userRole === "admin"
                        ? "bg-cjc-crimson/10 text-cjc-crimson"
                        : activity.userRole === "dean"
                        ? "bg-pending/10 text-pending"
                        : activity.userRole === "department"
                        ? "bg-success/10 text-success"
                        : activity.userRole === "organization"
                        ? "bg-cjc-gold/10 text-cjc-gold"
                        : "bg-cjc-blue/10 text-cjc-blue"
                    }`}
                  >
                    {activity.userRole}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card-glass p-5 animate-fade-in-up delay-300">
              <h3 className="font-semibold text-cjc-navy mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 p-3 rounded-xl bg-cjc-blue/5 border border-cjc-blue/10 hover:bg-cjc-blue/10 transition-colors"
                >
                  <UserPlus className="w-5 h-5 text-cjc-blue" />
                  <span className="text-sm font-medium text-cjc-navy">
                    Add New User
                  </span>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40 ml-auto" />
                </Link>
                <Link
                  href="/admin/departments"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <FolderPlus className="w-5 h-5 text-cjc-gold" />
                  <span className="text-sm font-medium text-cjc-navy">
                    Add Department
                  </span>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40 ml-auto" />
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-5 h-5 text-cjc-navy/60" />
                  <span className="text-sm font-medium text-cjc-navy">
                    System Settings
                  </span>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40 ml-auto" />
                </Link>
              </div>
            </div>

            {/* System Resources */}
            <div className="card-accent p-5 animate-fade-in-up delay-400">
              <h3 className="font-semibold text-cjc-navy mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-cjc-gold" />
                System Resources
              </h3>
              <div className="space-y-4">
                {/* Storage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-cjc-navy/60" />
                      <span className="text-sm text-cjc-navy">Storage</span>
                    </div>
                    <span className="text-sm font-medium text-cjc-navy">
                      {systemHealth.storageUsed}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cjc-blue rounded-full"
                      style={{ width: `${systemHealth.storageUsed}%` }}
                    />
                  </div>
                </div>

                {/* CPU */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cjc-navy/60" />
                      <span className="text-sm text-cjc-navy">CPU Load</span>
                    </div>
                    <span className="text-sm font-medium text-cjc-navy">
                      {systemHealth.cpuLoad}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full"
                      style={{ width: `${systemHealth.cpuLoad}%` }}
                    />
                  </div>
                </div>

                {/* Database */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-cjc-navy/60" />
                      <span className="text-sm text-cjc-navy">Database</span>
                    </div>
                    <span className="badge badge-approved text-xs">Healthy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Roles Summary */}
            <div className="card-glass p-5 animate-fade-in-up delay-500">
              <h3 className="font-semibold text-cjc-navy mb-4">Users by Role</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">Students</span>
                  <span className="text-sm font-bold text-cjc-navy">5,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">Approvers</span>
                  <span className="text-sm font-bold text-cjc-navy">45</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">Officers</span>
                  <span className="text-sm font-bold text-cjc-navy">18</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">Deans</span>
                  <span className="text-sm font-bold text-cjc-navy">6</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">Admins</span>
                  <span className="text-sm font-bold text-cjc-navy">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
