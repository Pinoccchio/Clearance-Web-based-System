"use client";

import Link from "next/link";
import Header from "@/components/layout/header";
import {
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  ChevronRight,
  Users,
  TrendingUp,
  FileText,
  AlertCircle,
} from "lucide-react";
import { mockUsers, mockClearanceRequests } from "@/lib/mock-data";

export default function ApproverDashboard() {
  const user = mockUsers.approver;

  // Mock stats for the approver
  const stats = {
    pendingReviews: 12,
    approvedToday: 8,
    onHold: 3,
    totalProcessed: 156,
  };

  // Pending clearances for review
  const pendingClearances = mockClearanceRequests.filter(
    (c) => c.status === "in_progress" || c.status === "pending"
  );

  return (
    <div>
      <Header
        title="Approver Dashboard"
        subtitle={`${user.department} - ${user.position}`}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-pending/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-pending" />
              </div>
              <span className="text-xs text-pending font-medium px-2 py-1 bg-pending/10 rounded-full">
                Needs Action
              </span>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              {stats.pendingReviews}
            </p>
            <p className="text-sm text-cjc-navy/60">Pending Reviews</p>
          </div>

          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <span className="text-xs text-success font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12%
              </span>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              {stats.approvedToday}
            </p>
            <p className="text-sm text-cjc-navy/60">Approved Today</p>
          </div>

          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <PauseCircle className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              {stats.onHold}
            </p>
            <p className="text-sm text-cjc-navy/60">On Hold</p>
          </div>

          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cjc-blue/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-cjc-blue" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              {stats.totalProcessed}
            </p>
            <p className="text-sm text-cjc-navy/60">Total Processed</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pending Reviews List */}
          <div className="lg:col-span-2 card-glass p-6 animate-fade-in-up delay-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-cjc-navy">
                Pending Reviews
              </h3>
              <Link
                href="/approver/pending"
                className="text-sm text-cjc-blue font-medium hover:text-cjc-blue-soft flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {pendingClearances.map((clearance, index) => (
                <div
                  key={clearance.id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-cjc-navy/10 flex items-center justify-center text-cjc-navy font-semibold">
                      {clearance.studentName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-medium text-cjc-navy">
                        {clearance.studentName}
                      </p>
                      <p className="text-sm text-cjc-navy/60">
                        {clearance.studentId} • {clearance.studentCourse} •{" "}
                        {clearance.studentYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-cjc-navy">
                        {clearance.type === "graduation" ? "Graduation" : "Semester"}{" "}
                        Clearance
                      </p>
                      <p className="text-xs text-cjc-navy/60">
                        Submitted {new Date(clearance.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-cjc-navy/40" />
                  </div>
                </div>
              ))}

              {pendingClearances.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                  <p className="text-cjc-navy font-medium">All caught up!</p>
                  <p className="text-sm text-cjc-navy/60">
                    No pending reviews at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card-glass p-5 animate-fade-in-up delay-200">
              <h3 className="font-semibold text-cjc-navy mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/approver/pending"
                  className="flex items-center gap-3 p-3 rounded-xl bg-pending/5 border border-pending/10 hover:bg-pending/10 transition-colors"
                >
                  <Clock className="w-5 h-5 text-pending" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-cjc-navy">
                      Review Pending
                    </p>
                    <p className="text-xs text-cjc-navy/60">
                      {stats.pendingReviews} students waiting
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40" />
                </Link>

                <Link
                  href="/approver/approved"
                  className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/10 hover:bg-success/10 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-cjc-navy">
                      View Approved
                    </p>
                    <p className="text-xs text-cjc-navy/60">
                      Recently approved clearances
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40" />
                </Link>

                <Link
                  href="/approver/history"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-cjc-navy/60" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-cjc-navy">
                      View History
                    </p>
                    <p className="text-xs text-cjc-navy/60">
                      All processed clearances
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40" />
                </Link>
              </div>
            </div>

            {/* Department Info */}
            <div className="card-accent p-5 animate-fade-in-up delay-300">
              <h3 className="font-semibold text-cjc-navy mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-cjc-gold" />
                Department Info
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">Department</span>
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

            {/* Tips */}
            <div className="card-glass p-5 bg-cjc-blue/5 animate-fade-in-up delay-400">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-cjc-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-cjc-navy mb-1">Tip</h4>
                  <p className="text-sm text-cjc-navy/70">
                    Review clearance requests promptly to help students complete
                    their requirements on time. Check for missing documents before
                    approving.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
