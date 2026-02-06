"use client";

import { CheckCircle2, Clock, Users, TrendingUp, GraduationCap } from "lucide-react";
import { mockUsers } from "@/lib/mock-data";

export default function DepartmentDashboard() {
  const user = mockUsers.department;

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">{user.department}</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">
            Department Dashboard
          </h1>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <Users className="w-8 h-8 text-cjc-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">342</p>
            <p className="text-sm text-warm-muted">Total Students</p>
          </div>
          <div className="card p-4 text-center">
            <Clock className="w-8 h-8 text-pending mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">28</p>
            <p className="text-sm text-warm-muted">Pending</p>
          </div>
          <div className="card p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">314</p>
            <p className="text-sm text-warm-muted">Cleared</p>
          </div>
          <div className="card p-4 text-center">
            <TrendingUp className="w-8 h-8 text-cjc-gold mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">91.8%</p>
            <p className="text-sm text-warm-muted">Clearance Rate</p>
          </div>
        </div>

        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-cjc-gold/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-cjc-gold" />
          </div>
          <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">Department Dashboard</h2>
          <p className="text-warm-muted max-w-md mx-auto mb-4">
            Manage student clearances and view department statistics.
            This is a placeholder - full functionality coming soon.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm text-warm-muted">
            <span className="px-3 py-1 bg-surface-warm rounded-full">{user.department}</span>
            <span className="px-3 py-1 bg-surface-warm rounded-full">{user.position}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
