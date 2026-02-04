"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronRight,
  Download,
  FileText,
  BookOpen,
  CreditCard,
  Users,
  Building2,
  Heart,
  Calendar,
  Printer,
} from "lucide-react";
import { mockUsers, mockClearanceRequests } from "@/lib/mock-data";

export default function StudentClearancePage() {
  const user = mockUsers.student;
  const currentClearance = mockClearanceRequests[0];

  const getDeptIcon = (deptName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Library: <BookOpen className="w-5 h-5" />,
      "Finance Office": <CreditCard className="w-5 h-5" />,
      Registrar: <FileText className="w-5 h-5" />,
      "Student Affairs": <Users className="w-5 h-5" />,
      "CCIS Department": <Building2 className="w-5 h-5" />,
      "Guidance Office": <Heart className="w-5 h-5" />,
    };
    return icons[deptName] || <Building2 className="w-5 h-5" />;
  };

  const approvedCount = currentClearance.items.filter((i) => i.status === "approved").length;
  const totalCount = currentClearance.items.length;
  const progressPercent = Math.round((approvedCount / totalCount) * 100);
  const isComplete = progressPercent === 100;

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Track your clearance status</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">My Clearance</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Student Info */}
        <div className="card p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-cjc-navy flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-cjc-navy">
                  {user.firstName} {user.middleName?.[0]}. {user.lastName}
                </h2>
                <p className="text-warm-muted text-sm font-mono">{user.studentId}</p>
                <p className="text-cjc-navy mt-1">{user.course}</p>
                <p className="text-warm-muted text-sm">{user.yearLevel}</p>
              </div>
            </div>

            <div className="lg:text-right space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-cream border border-border-warm">
                <Calendar className="w-4 h-4 text-cjc-gold" />
                <span className="text-sm font-medium text-cjc-navy">
                  {currentClearance.academicYear} · {currentClearance.semester}
                </span>
              </div>
              <p className="text-sm text-warm-muted">
                Type: <span className="font-medium text-cjc-navy capitalize">{currentClearance.type} Clearance</span>
              </p>
              <p className="text-xs text-warm-muted">
                Submitted: {new Date(currentClearance.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6 pt-6 border-t border-border-warm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-cjc-navy">Overall Progress</span>
              <span className="text-sm font-bold text-cjc-gold">
                {approvedCount}/{totalCount} Departments
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-warm-muted mt-2">
              {progressPercent}% complete · {totalCount - approvedCount} department(s) remaining
            </p>
          </div>
        </div>

        {/* Department Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentClearance.items.map((item) => (
            <div
              key={item.id}
              className={`card p-4 border-l-4 ${
                item.status === "approved"
                  ? "border-l-success"
                  : item.status === "pending"
                  ? "border-l-pending"
                  : item.status === "on_hold"
                  ? "border-l-warning"
                  : "border-l-danger"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-surface-warm flex items-center justify-center text-cjc-navy">
                  {getDeptIcon(item.departmentName)}
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${
                    item.status === "approved"
                      ? "bg-success/10 text-success"
                      : item.status === "pending"
                      ? "bg-pending/10 text-pending"
                      : item.status === "on_hold"
                      ? "bg-warning/10 text-warning"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {item.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                  {item.status === "pending" && <Clock className="w-3 h-3" />}
                  {item.status === "on_hold" && <AlertCircle className="w-3 h-3" />}
                  {item.status === "rejected" && <XCircle className="w-3 h-3" />}
                  <span className="capitalize">{item.status.replace("_", " ")}</span>
                </span>
              </div>

              <h3 className="font-semibold text-cjc-navy mb-1">{item.departmentName}</h3>

              {item.status === "approved" && item.approvedBy && (
                <div className="mt-3 pt-3 border-t border-border-warm">
                  <p className="text-xs text-warm-muted">
                    Approved by: <span className="font-medium">{item.approvedBy}</span>
                  </p>
                  {item.approvedAt && (
                    <p className="text-xs text-warm-muted/70">
                      {new Date(item.approvedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {item.status === "pending" && (
                <p className="text-xs text-pending mt-3">Awaiting department review</p>
              )}

              {item.status === "on_hold" && item.remarks && (
                <div className="mt-3 p-2 rounded-lg bg-warning/5 border border-warning/20">
                  <p className="text-xs text-warning font-medium">{item.remarks}</p>
                </div>
              )}

              {item.status === "rejected" && item.remarks && (
                <div className="mt-3 p-2 rounded-lg bg-danger/5 border border-danger/20">
                  <p className="text-xs text-danger font-medium">{item.remarks}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {isComplete && (
            <>
              <button className="btn btn-gold">
                <Download className="w-4 h-4" />
                Download Certificate
              </button>
              <button className="btn btn-secondary">
                <Printer className="w-4 h-4" />
                Print Clearance
              </button>
            </>
          )}
          <Link href="/student/requirements" className="btn btn-secondary">
            View Requirements
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Timeline */}
        <div className="card-accent p-6">
          <h3 className="font-display font-bold text-cjc-navy mb-4">Clearance Timeline</h3>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-warm" />
            <div className="space-y-6">
              {currentClearance.items
                .filter((item) => item.status === "approved")
                .sort((a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime())
                .map((item) => (
                  <div key={item.id} className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-success/10 border-4 border-white flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-cjc-navy">{item.departmentName} Cleared</p>
                      <p className="text-sm text-warm-muted">Approved by {item.approvedBy}</p>
                      <p className="text-xs text-warm-muted/70 mt-1">
                        {item.approvedAt && new Date(item.approvedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-cjc-blue/10 border-4 border-white flex items-center justify-center">
                  <FileText className="w-4 h-4 text-cjc-blue" />
                </div>
                <div>
                  <p className="font-medium text-cjc-navy">Clearance Request Submitted</p>
                  <p className="text-sm text-warm-muted">
                    {currentClearance.academicYear} - {currentClearance.semester}
                  </p>
                  <p className="text-xs text-warm-muted/70 mt-1">
                    {new Date(currentClearance.createdAt).toLocaleString()}
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
