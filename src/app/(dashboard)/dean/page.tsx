"use client";

import Link from "next/link";
import Header from "@/components/layout/header";
import {
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Building2,
  ChevronRight,
  BarChart3,
  GraduationCap,
  Award,
  AlertTriangle,
} from "lucide-react";
import { mockUsers, departments, dashboardStats } from "@/lib/mock-data";

export default function DeanDashboard() {
  const user = mockUsers.dean;

  // Mock data for department performance
  const departmentPerformance = [
    { name: "Library", approved: 45, pending: 12, rate: 89 },
    { name: "Finance", approved: 38, pending: 18, rate: 78 },
    { name: "Registrar", approved: 52, pending: 8, rate: 94 },
    { name: "Student Affairs", approved: 41, pending: 15, rate: 82 },
    { name: "CCIS Dept", approved: 48, pending: 10, rate: 91 },
    { name: "Guidance", approved: 35, pending: 20, rate: 72 },
  ];

  return (
    <div>
      <Header
        title="Dean Dashboard"
        subtitle={`${user.department} - College Overview`}
      />

      <div className="p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="card-glass p-6 relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cjc-gold/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-8 h-8 text-cjc-gold" />
              <div>
                <h2 className="font-display text-xl font-bold text-cjc-navy">
                  Welcome, Dean {user.lastName}
                </h2>
                <p className="text-cjc-navy/60">
                  {user.department} • {user.position}
                </p>
              </div>
            </div>
            <p className="text-cjc-navy/70 max-w-2xl">
              Monitor the clearance progress across all departments in the College of
              Computing and Information Sciences. Track completion rates and identify
              bottlenecks.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up delay-100">
          <div className="card-accent p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cjc-blue/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-cjc-blue" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              {dashboardStats.totalStudents.toLocaleString()}
            </p>
            <p className="text-sm text-cjc-navy/60">CCIS Students</p>
          </div>

          <div className="card-accent p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              {dashboardStats.completionRate}%
            </p>
            <p className="text-sm text-cjc-navy/60">Completion Rate</p>
          </div>

          <div className="card-accent p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-pending/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-pending" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-cjc-navy">
              {dashboardStats.pendingRequests}
            </p>
            <p className="text-sm text-cjc-navy/60">Pending Clearances</p>
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
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Department Performance */}
          <div className="lg:col-span-2 card-glass p-6 animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-cjc-navy">
                Department Performance
              </h3>
              <Link
                href="/dean/departments"
                className="text-sm text-cjc-blue font-medium hover:text-cjc-blue-soft flex items-center gap-1"
              >
                View Details
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {departmentPerformance.map((dept, index) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-cjc-navy">
                      {dept.name}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-success">
                        {dept.approved} approved
                      </span>
                      <span className="text-xs text-pending">
                        {dept.pending} pending
                      </span>
                      <span className="text-sm font-bold text-cjc-navy">
                        {dept.rate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dept.rate >= 90
                          ? "bg-success"
                          : dept.rate >= 80
                          ? "bg-cjc-gold"
                          : "bg-warning"
                      }`}
                      style={{
                        width: `${dept.rate}%`,
                        animationDelay: `${index * 100}ms`,
                      }}
                    />
                  </div>
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
                  href="/dean/overview"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="w-5 h-5 text-cjc-blue" />
                  <span className="text-sm font-medium text-cjc-navy">
                    View Reports
                  </span>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40 ml-auto" />
                </Link>
                <Link
                  href="/dean/students"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-5 h-5 text-cjc-gold" />
                  <span className="text-sm font-medium text-cjc-navy">
                    Student List
                  </span>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40 ml-auto" />
                </Link>
                <Link
                  href="/dean/departments"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Building2 className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium text-cjc-navy">
                    Departments
                  </span>
                  <ChevronRight className="w-4 h-4 text-cjc-navy/40 ml-auto" />
                </Link>
              </div>
            </div>

            {/* Alerts */}
            <div className="card-glass border-l-4 border-l-warning p-5 animate-fade-in-up delay-400">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-cjc-navy mb-1">
                    Attention Required
                  </h4>
                  <p className="text-sm text-cjc-navy/70 mb-3">
                    Guidance Office has the lowest clearance rate (72%). Consider
                    reviewing their process.
                  </p>
                  <Link
                    href="/dean/departments"
                    className="text-sm text-cjc-blue font-medium hover:text-cjc-blue-soft"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>

            {/* Graduation Stats */}
            <div className="card-accent p-5 animate-fade-in-up delay-500">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-cjc-gold" />
                <h3 className="font-semibold text-cjc-navy">Graduation Clearance</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">Total Candidates</span>
                  <span className="text-sm font-bold text-cjc-navy">234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">Fully Cleared</span>
                  <span className="text-sm font-bold text-success">198</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cjc-navy/60">In Progress</span>
                  <span className="text-sm font-bold text-pending">36</span>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-cjc-navy">
                      Completion Rate
                    </span>
                    <span className="text-lg font-bold text-cjc-gold">84.6%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
