"use client";

import { CheckCircle2, Clock, PauseCircle, FileText, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function OfficeDashboard() {
  const { orgName, profile } = useAuth();

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">{orgName ?? "Office"}</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">
            Office Dashboard
          </h1>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <Clock className="w-8 h-8 text-pending mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">12</p>
            <p className="text-sm text-warm-muted">Pending</p>
          </div>
          <div className="card p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">8</p>
            <p className="text-sm text-warm-muted">Approved Today</p>
          </div>
          <div className="card p-4 text-center">
            <PauseCircle className="w-8 h-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">3</p>
            <p className="text-sm text-warm-muted">On Hold</p>
          </div>
          <div className="card p-4 text-center">
            <FileText className="w-8 h-8 text-cjc-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-cjc-navy">156</p>
            <p className="text-sm text-warm-muted">Total Processed</p>
          </div>
        </div>

        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-ccis-blue-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-ccis-blue-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">Office Dashboard</h2>
          <p className="text-warm-muted max-w-md mx-auto mb-4">
            Review and manage student clearance requests.
            This is a placeholder - full functionality coming soon.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm text-warm-muted">
            <span className="px-3 py-1 bg-surface-warm rounded-full">{orgName ?? "Office"}</span>
            <span className="px-3 py-1 bg-surface-warm rounded-full">{profile?.role === "office" ? "Office Head" : "Staff"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
