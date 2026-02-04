"use client";

import { useState } from "react";
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  Settings,
} from "lucide-react";
import { departments } from "@/lib/mock-data";

export default function AdminDepartmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Manage college departments</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">Department Management</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-cjc-navy">{departments.length}</p>
            <p className="text-sm text-warm-muted">Total Departments</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-success">{departments.length}</p>
            <p className="text-sm text-warm-muted">Active</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-warm-muted">0</p>
            <p className="text-sm text-warm-muted">Inactive</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
            <input
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 border border-border-warm rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cjc-blue/20 focus:border-cjc-blue"
            />
          </div>
          <button className="btn btn-gold">
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        </div>

        {/* Departments Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-warm border-b border-border-warm">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Department</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Dean</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-cjc-navy">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-cjc-navy">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm">
              {filteredDepartments.map((dept) => (
                <tr key={dept.id} className="hover:bg-surface-warm transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cjc-gold/10 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-cjc-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-cjc-navy">{dept.name}</p>
                        <p className="text-xs text-warm-muted">{dept.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-1 rounded bg-cjc-navy text-white font-mono">{dept.code}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-cjc-navy">{dept.head || "Not assigned"}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">Active</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 hover:bg-surface-warm rounded-lg transition-colors">
                        <Settings className="w-4 h-4 text-warm-muted" />
                      </button>
                      <button className="p-2 hover:bg-surface-warm rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4 text-warm-muted" />
                      </button>
                      <button className="p-2 hover:bg-danger/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDepartments.length === 0 && (
          <div className="card p-12 text-center">
            <GraduationCap className="w-12 h-12 text-warm-muted mx-auto mb-3" />
            <p className="text-warm-muted">No departments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
