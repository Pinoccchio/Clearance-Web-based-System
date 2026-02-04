"use client";

import {
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Calendar,
  ChevronRight,
  Award,
} from "lucide-react";
import { mockUsers } from "@/lib/mock-data";

interface ClearanceHistory {
  id: string;
  academicYear: string;
  semester: string;
  type: "semester" | "graduation";
  status: "completed" | "in_progress";
  completedAt?: string;
  progress: number;
}

export default function StudentHistoryPage() {
  const user = mockUsers.student;

  const clearanceHistory: ClearanceHistory[] = [
    { id: "hist_001", academicYear: "2024-2025", semester: "2nd Semester", type: "semester", status: "in_progress", progress: 67 },
    { id: "hist_002", academicYear: "2024-2025", semester: "1st Semester", type: "semester", status: "completed", completedAt: "2024-01-15", progress: 100 },
    { id: "hist_003", academicYear: "2023-2024", semester: "2nd Semester", type: "semester", status: "completed", completedAt: "2023-06-20", progress: 100 },
    { id: "hist_004", academicYear: "2023-2024", semester: "1st Semester", type: "semester", status: "completed", completedAt: "2023-01-18", progress: 100 },
    { id: "hist_005", academicYear: "2022-2023", semester: "2nd Semester", type: "semester", status: "completed", completedAt: "2022-06-15", progress: 100 },
    { id: "hist_006", academicYear: "2022-2023", semester: "1st Semester", type: "semester", status: "completed", completedAt: "2022-01-20", progress: 100 },
  ];

  const completedCount = clearanceHistory.filter((h) => h.status === "completed").length;

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">View your past clearance records</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">Clearance History</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="w-11 h-11 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-cjc-navy">{completedCount}</p>
            <p className="text-sm text-warm-muted">Completed</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-11 h-11 rounded-full bg-pending/10 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5 text-pending" />
            </div>
            <p className="text-2xl font-bold text-cjc-navy">
              {clearanceHistory.filter((h) => h.status === "in_progress").length}
            </p>
            <p className="text-sm text-warm-muted">In Progress</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-11 h-11 rounded-full bg-cjc-gold/10 flex items-center justify-center mx-auto mb-3">
              <Award className="w-5 h-5 text-cjc-gold" />
            </div>
            <p className="text-2xl font-bold text-cjc-navy">
              {completedCount > 0 ? Math.round(clearanceHistory.filter((h) => h.status === "completed").reduce((acc, h) => acc + h.progress, 0) / completedCount) : 0}%
            </p>
            <p className="text-sm text-warm-muted">Avg. Completion</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-11 h-11 rounded-full bg-cjc-blue/10 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-5 h-5 text-cjc-blue" />
            </div>
            <p className="text-2xl font-bold text-cjc-navy">{clearanceHistory.length}</p>
            <p className="text-sm text-warm-muted">Total Records</p>
          </div>
        </div>

        {/* History List */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border-warm">
            <h3 className="font-display font-bold text-cjc-navy">Clearance Records</h3>
          </div>

          <div className="divide-y divide-border-warm">
            {clearanceHistory.map((history) => (
              <div key={history.id} className="p-4 hover:bg-surface-warm transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${history.status === "completed" ? "bg-success/10" : "bg-pending/10"}`}>
                      {history.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-pending" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-cjc-navy">
                        {history.academicYear} - {history.semester}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-warm-muted capitalize">{history.type} Clearance</span>
                        {history.status === "completed" && history.completedAt && (
                          <>
                            <span className="text-warm-muted">·</span>
                            <span className="text-sm text-warm-muted">
                              Completed: {new Date(history.completedAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Progress */}
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-2 bg-surface-warm rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${history.progress === 100 ? "bg-success" : "bg-cjc-gold"}`}
                          style={{ width: `${history.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-cjc-navy">{history.progress}%</span>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${
                      history.status === "completed" ? "bg-success/10 text-success" : "bg-pending/10 text-pending"
                    }`}>
                      {history.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {history.status === "completed" ? "Completed" : "In Progress"}
                    </span>

                    {/* Actions */}
                    {history.status === "completed" ? (
                      <button className="p-2 rounded-lg bg-cjc-blue/10 text-cjc-blue hover:bg-cjc-blue/20 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    ) : (
                      <button className="p-2 rounded-lg bg-surface-warm text-warm-muted hover:bg-surface-cream transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download All */}
        <div className="card-accent p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-cjc-gold/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-cjc-gold" />
              </div>
              <div>
                <h4 className="font-semibold text-cjc-navy">Download Complete History</h4>
                <p className="text-sm text-warm-muted">Get a PDF copy of all your clearance records</p>
              </div>
            </div>
            <button className="btn btn-gold">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
