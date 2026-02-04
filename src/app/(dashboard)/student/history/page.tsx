"use client";

import Header from "@/components/layout/header";
import {
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Calendar,
  ChevronRight,
  Award,
} from "lucide-react";
import { mockUsers, notifications } from "@/lib/mock-data";

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
    {
      id: "hist_001",
      academicYear: "2024-2025",
      semester: "2nd Semester",
      type: "semester",
      status: "in_progress",
      progress: 67,
    },
    {
      id: "hist_002",
      academicYear: "2024-2025",
      semester: "1st Semester",
      type: "semester",
      status: "completed",
      completedAt: "2024-01-15",
      progress: 100,
    },
    {
      id: "hist_003",
      academicYear: "2023-2024",
      semester: "2nd Semester",
      type: "semester",
      status: "completed",
      completedAt: "2023-06-20",
      progress: 100,
    },
    {
      id: "hist_004",
      academicYear: "2023-2024",
      semester: "1st Semester",
      type: "semester",
      status: "completed",
      completedAt: "2023-01-18",
      progress: 100,
    },
    {
      id: "hist_005",
      academicYear: "2022-2023",
      semester: "2nd Semester",
      type: "semester",
      status: "completed",
      completedAt: "2022-06-15",
      progress: 100,
    },
    {
      id: "hist_006",
      academicYear: "2022-2023",
      semester: "1st Semester",
      type: "semester",
      status: "completed",
      completedAt: "2022-01-20",
      progress: 100,
    },
  ];

  const completedCount = clearanceHistory.filter((h) => h.status === "completed").length;

  return (
    <div>
      <Header
        title="Clearance History"
        subtitle="View your past clearance records"
        notifications={notifications}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
          <div className="card-glass p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <p className="text-2xl font-display font-bold text-cjc-navy">
              {completedCount}
            </p>
            <p className="text-sm text-cjc-navy/60">Completed</p>
          </div>
          <div className="card-glass p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-pending/10 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-pending" />
            </div>
            <p className="text-2xl font-display font-bold text-cjc-navy">
              {clearanceHistory.filter((h) => h.status === "in_progress").length}
            </p>
            <p className="text-sm text-cjc-navy/60">In Progress</p>
          </div>
          <div className="card-glass p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-cjc-gold/10 flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-cjc-gold" />
            </div>
            <p className="text-2xl font-display font-bold text-cjc-navy">
              {Math.round(
                clearanceHistory
                  .filter((h) => h.status === "completed")
                  .reduce((acc, h) => acc + h.progress, 0) / completedCount
              )}%
            </p>
            <p className="text-sm text-cjc-navy/60">Avg. Completion</p>
          </div>
          <div className="card-glass p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-cjc-blue/10 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-cjc-blue" />
            </div>
            <p className="text-2xl font-display font-bold text-cjc-navy">
              {clearanceHistory.length}
            </p>
            <p className="text-sm text-cjc-navy/60">Total Records</p>
          </div>
        </div>

        {/* History List */}
        <div className="card-glass overflow-hidden animate-fade-in-up delay-100">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-lg text-cjc-navy">
              Clearance Records
            </h3>
          </div>

          <div className="divide-y divide-gray-100">
            {clearanceHistory.map((history, index) => (
              <div
                key={history.id}
                className="p-5 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        history.status === "completed"
                          ? "bg-success/10"
                          : "bg-pending/10"
                      }`}
                    >
                      {history.status === "completed" ? (
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      ) : (
                        <Clock className="w-6 h-6 text-pending" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-cjc-navy">
                        {history.academicYear} - {history.semester}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-cjc-navy/60 capitalize">
                          {history.type} Clearance
                        </span>
                        {history.status === "completed" && history.completedAt && (
                          <>
                            <span className="text-cjc-navy/30">•</span>
                            <span className="text-sm text-cjc-navy/60">
                              Completed:{" "}
                              {new Date(history.completedAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Progress */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            history.progress === 100
                              ? "bg-success"
                              : "bg-gradient-to-r from-cjc-gold to-cjc-gold-light"
                          }`}
                          style={{ width: `${history.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-cjc-navy">
                        {history.progress}%
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`badge ${
                        history.status === "completed"
                          ? "badge-completed"
                          : "badge-in-progress"
                      }`}
                    >
                      {history.status === "completed" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          In Progress
                        </>
                      )}
                    </span>

                    {/* Actions */}
                    {history.status === "completed" ? (
                      <button className="p-2 rounded-lg bg-cjc-blue/10 text-cjc-blue hover:bg-cjc-blue/20 transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    ) : (
                      <button className="p-2 rounded-lg bg-gray-100 text-cjc-navy/60 hover:bg-gray-200 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download All */}
        <div className="card-accent p-5 animate-fade-in-up delay-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cjc-gold/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-cjc-gold" />
              </div>
              <div>
                <h4 className="font-semibold text-cjc-navy">
                  Download Complete History
                </h4>
                <p className="text-sm text-cjc-navy/60">
                  Get a PDF copy of all your clearance records
                </p>
              </div>
            </div>
            <button className="btn-gold flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
