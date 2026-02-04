"use client";

import { useState } from "react";
import {
  Calendar,
  Mail,
  Database,
  Save,
  RefreshCw,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [currentSemester, setCurrentSemester] = useState("2nd Semester");

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Configure system parameters</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">System Settings</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Academic Period */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-cjc-gold" />
            <h3 className="font-display font-bold text-cjc-navy">Academic Period</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cjc-navy mb-1.5">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g., 2024-2025"
                className="w-full h-10 px-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cjc-navy mb-1.5">Current Semester</label>
              <select
                value={currentSemester}
                onChange={(e) => setCurrentSemester(e.target.value)}
                className="w-full h-10 px-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
              >
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-4 bg-cjc-blue/5 border border-cjc-blue/20 rounded-lg">
            <p className="text-sm text-cjc-blue">
              Changing the academic period will affect all new clearance requests. Existing requests will retain their original period.
            </p>
          </div>
        </div>

        {/* Clearance Deadlines */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-cjc-gold" />
            <h3 className="font-display font-bold text-cjc-navy">Clearance Deadlines</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-cjc-navy mb-1.5">Semester Clearance Deadline</label>
              <input
                type="date"
                defaultValue="2025-03-15"
                className="w-full h-10 px-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cjc-navy mb-1.5">Graduation Clearance Deadline</label>
              <input
                type="date"
                defaultValue="2025-04-30"
                className="w-full h-10 px-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 rounded-lg bg-surface-warm cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border-warm text-cjc-blue focus:ring-cjc-blue" />
            <div>
              <p className="text-sm font-medium text-cjc-navy">Enable deadline notifications</p>
              <p className="text-xs text-warm-muted">Send reminders 7, 3, and 1 day before deadline</p>
            </div>
          </label>
        </div>

        {/* Email Notifications */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-cjc-gold" />
            <h3 className="font-display font-bold text-cjc-navy">Email Notifications</h3>
          </div>

          <div className="space-y-2">
            {[
              { title: "Clearance Status Updates", desc: "Notify students when their clearance status changes" },
              { title: "New Clearance Submissions", desc: "Notify department staff of new submissions" },
              { title: "Deadline Reminders", desc: "Send deadline reminders to students" },
              { title: "System Announcements", desc: "Send email for urgent system announcements" },
            ].map((item) => (
              <label key={item.title} className="flex items-center justify-between p-4 rounded-lg bg-surface-warm cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-cjc-navy">{item.title}</p>
                  <p className="text-xs text-warm-muted">{item.desc}</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border-warm text-cjc-blue focus:ring-cjc-blue" />
              </label>
            ))}
          </div>
        </div>

        {/* System Maintenance */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-cjc-gold" />
            <h3 className="font-display font-bold text-cjc-navy">System Maintenance</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-warm">
              <div>
                <p className="text-sm font-medium text-cjc-navy">Database Backup</p>
                <p className="text-xs text-warm-muted">Last backup: January 20, 2025, 3:00 AM</p>
              </div>
              <button className="btn btn-secondary text-sm py-2">
                <RefreshCw className="w-4 h-4" />
                Backup Now
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-warm">
              <div>
                <p className="text-sm font-medium text-cjc-navy">Clear Cache</p>
                <p className="text-xs text-warm-muted">Clear system cache to improve performance</p>
              </div>
              <button className="btn btn-secondary text-sm py-2">Clear Cache</button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-warning/5 border border-warning/20">
              <div>
                <p className="text-sm font-medium text-cjc-navy">Maintenance Mode</p>
                <p className="text-xs text-warm-muted">Temporarily disable user access for maintenance</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">Disabled</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="btn btn-gold">
            <Save className="w-4 h-4" />
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
}
