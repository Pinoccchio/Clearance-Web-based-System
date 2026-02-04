"use client";

import Link from "next/link";
import Header from "@/components/layout/header";
import {
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  FileText,
  ChevronRight,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { mockUsers, mockStudents, mockClearanceRequests, dashboardStats } from "@/lib/mock-data";

export default function OrganizationDashboard() {
  const user = mockUsers.organization;

  return (
    <div>
      <Header
        title="Organization Dashboard"
        subtitle={`${user.department} - ${user.position}`}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cjc-blue/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-cjc-blue" />
              </div>
              <span className="text-xs text-success font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +5%
              </span>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              156
            </p>
            <p className="text-sm text-cjc-navy/60">Total Members</p>
          </div>

          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-pending/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-pending" />
              </div>
              <span className="text-xs text-danger font-medium flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" />
                -3%
              </span>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              24
            </p>
            <p className="text-sm text-cjc-navy/60">Pending Clearances</p>
          </div>

          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              132
            </p>
            <p className="text-sm text-cjc-navy/60">Cleared Members</p>
          </div>

          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cjc-gold/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cjc-gold" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              84.6%
            </p>
            <p className="text-sm text-cjc-navy/60">Clearance Rate</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Clearances */}
          <div className="lg:col-span-2 card-glass p-6 animate-fade-in-up delay-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-cjc-navy">
                Recent Clearance Requests
              </h3>
              <Link
                href="/organization/clearances"
                className="text-sm text-cjc-blue font-medium hover:text-cjc-blue-soft flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy/60">
                      Member
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy/60">
                      Course
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy/60">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy/60">
                      Progress
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy/60">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockClearanceRequests.map((clearance) => (
                    <tr
                      key={clearance.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cjc-navy/10 flex items-center justify-center text-xs font-semibold text-cjc-navy">
                            {clearance.studentName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-cjc-navy">
                              {clearance.studentName}
                            </p>
                            <p className="text-xs text-cjc-navy/60">
                              {clearance.studentId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-cjc-navy">
                          {clearance.studentCourse}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-cjc-navy capitalize">
                          {clearance.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cjc-gold rounded-full"
                              style={{ width: `${clearance.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-cjc-navy">
                            {clearance.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`badge ${
                            clearance.status === "completed"
                              ? "badge-completed"
                              : clearance.status === "in_progress"
                              ? "badge-in-progress"
                              : "badge-pending"
                          }`}
                        >
                          {clearance.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card-glass p-5 animate-fade-in-up delay-200">
              <h3 className="font-semibold text-cjc-navy mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/organization/clearances"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-cjc-blue" />
                  <span className="text-sm font-medium text-cjc-navy">
                    Manage Clearances
                  </span>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40 ml-auto" />
                </Link>
                <Link
                  href="/organization/members"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-5 h-5 text-cjc-gold" />
                  <span className="text-sm font-medium text-cjc-navy">
                    View Members
                  </span>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40 ml-auto" />
                </Link>
                <Link
                  href="/organization/reports"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium text-cjc-navy">
                    Generate Reports
                  </span>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40 ml-auto" />
                </Link>
              </div>
            </div>

            {/* Organization Info */}
            <div className="card-accent p-5 animate-fade-in-up delay-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-cjc-navy">Organization Info</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">Organization</span>
                  <span className="text-sm font-medium text-cjc-navy">
                    {user.department}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">Position</span>
                  <span className="text-sm font-medium text-cjc-navy">
                    {user.position}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">Status</span>
                  <span className="badge badge-approved">Active</span>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="card-glass p-5 animate-fade-in-up delay-400">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-cjc-gold" />
                <h3 className="font-semibold text-cjc-navy">Upcoming</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-cjc-crimson/5 border border-cjc-crimson/10">
                  <p className="text-sm font-medium text-cjc-navy">
                    Clearance Deadline
                  </p>
                  <p className="text-xs text-cjc-navy/60">February 28, 2025</p>
                </div>
                <div className="p-3 rounded-lg bg-cjc-blue/5 border border-cjc-blue/10">
                  <p className="text-sm font-medium text-cjc-navy">
                    General Assembly
                  </p>
                  <p className="text-xs text-cjc-navy/60">March 5, 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
