"use client";

import { Users, GraduationCap, Building2, UsersRound, LayoutDashboard } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">System Administration</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">
            Admin Dashboard
          </h1>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <Users className="w-8 h-8 text-cjc-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">156</p>
            <p className="text-sm text-warm-muted">Total Users</p>
          </div>
          <div className="card p-4 text-center">
            <GraduationCap className="w-8 h-8 text-ccis-blue-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">5</p>
            <p className="text-sm text-warm-muted">Departments</p>
          </div>
          <div className="card p-4 text-center">
            <Building2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">8</p>
            <p className="text-sm text-warm-muted">Offices</p>
          </div>
          <div className="card p-4 text-center">
            <UsersRound className="w-8 h-8 text-pending mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">12</p>
            <p className="text-sm text-warm-muted">Clubs</p>
          </div>
        </div>

        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-cjc-blue/10 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-cjc-blue" />
          </div>
          <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">Admin Dashboard</h2>
          <p className="text-warm-muted max-w-md mx-auto mb-4">
            Manage users, departments, offices, and clubs.
            Advanced analytics and system monitoring features coming soon.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm text-warm-muted">
            <span className="px-3 py-1 bg-surface-warm rounded-full">System Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
