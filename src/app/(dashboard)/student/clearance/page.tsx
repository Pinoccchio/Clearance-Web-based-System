"use client";

import Link from "next/link";
import Header from "@/components/layout/header";
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
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { mockUsers, mockClearanceRequests, notifications } from "@/lib/mock-data";

export default function StudentClearancePage() {
  const user = mockUsers.student;
  const currentClearance = mockClearanceRequests[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "border-success bg-success/5";
      case "pending":
        return "border-pending bg-pending/5";
      case "rejected":
        return "border-danger bg-danger/5";
      case "on_hold":
        return "border-warning bg-warning/5";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="badge badge-approved">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="badge badge-pending">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="badge badge-rejected">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case "on_hold":
        return (
          <span className="badge badge-on-hold">
            <AlertCircle className="w-3 h-3" />
            On Hold
          </span>
        );
      default:
        return null;
    }
  };

  const getDeptIcon = (deptName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Library: <BookOpen className="w-6 h-6" />,
      "Finance Office": <CreditCard className="w-6 h-6" />,
      Registrar: <FileText className="w-6 h-6" />,
      "Student Affairs": <Users className="w-6 h-6" />,
      "CCIS Department": <Building2 className="w-6 h-6" />,
      "Guidance Office": <Heart className="w-6 h-6" />,
    };
    return icons[deptName] || <Building2 className="w-6 h-6" />;
  };

  const approvedCount = currentClearance.items.filter((i) => i.status === "approved").length;
  const totalCount = currentClearance.items.length;
  const progressPercent = Math.round((approvedCount / totalCount) * 100);

  return (
    <div>
      <Header
        title="My Clearance"
        subtitle="Track your clearance status"
        notifications={notifications}
      />

      <div className="p-6 space-y-6">
        {/* Clearance Info Card */}
        <div className="card-glass p-6 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Student Info */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-cjc-navy flex items-center justify-center text-white text-2xl font-display font-bold">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-cjc-navy">
                  {user.firstName} {user.middleName?.[0]}. {user.lastName}
                </h2>
                <p className="text-cjc-navy/60 font-mono text-sm">{user.studentId}</p>
                <p className="text-cjc-navy/70 mt-1">{user.course}</p>
                <p className="text-cjc-navy/60 text-sm">{user.yearLevel}</p>
              </div>
            </div>

            {/* Clearance Type & Period */}
            <div className="lg:text-right space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cjc-gold/10 border border-cjc-gold/20">
                <Calendar className="w-4 h-4 text-cjc-gold" />
                <span className="text-sm font-semibold text-cjc-navy">
                  {currentClearance.academicYear} • {currentClearance.semester}
                </span>
              </div>
              <p className="text-sm text-cjc-navy/60">
                Type:{" "}
                <span className="font-medium text-cjc-navy capitalize">
                  {currentClearance.type} Clearance
                </span>
              </p>
              <p className="text-xs text-cjc-navy/50">
                Submitted: {new Date(currentClearance.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-cjc-navy">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-cjc-gold">
                {approvedCount}/{totalCount} Departments
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-cjc-gold rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-cjc-navy/60 mt-2">
              {progressPercent}% complete •{" "}
              {totalCount - approvedCount} department(s) remaining
            </p>
          </div>
        </div>

        {/* Department Status Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentClearance.items.map((item, index) => (
            <div
              key={item.id}
              className={`card-glass p-5 border-l-4 ${getStatusColor(item.status)} animate-fade-in-up card-hover`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-cjc-navy/5 flex items-center justify-center text-cjc-navy">
                  {getDeptIcon(item.departmentName)}
                </div>
                {getStatusBadge(item.status)}
              </div>

              <h3 className="font-semibold text-cjc-navy mb-1">
                {item.departmentName}
              </h3>

              {item.status === "approved" && item.approvedBy && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-cjc-navy/60">
                    Approved by: <span className="font-medium">{item.approvedBy}</span>
                  </p>
                  {item.approvedAt && (
                    <p className="text-xs text-cjc-navy/50">
                      {new Date(item.approvedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {item.status === "pending" && (
                <div className="mt-3">
                  <p className="text-xs text-pending">
                    Awaiting review from department
                  </p>
                </div>
              )}

              {item.status === "on_hold" && item.remarks && (
                <div className="mt-3 p-2 rounded-lg bg-warning/10">
                  <p className="text-xs text-warning font-medium">
                    {item.remarks}
                  </p>
                </div>
              )}

              {item.status === "rejected" && item.remarks && (
                <div className="mt-3 p-2 rounded-lg bg-danger/10">
                  <p className="text-xs text-danger font-medium">
                    {item.remarks}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {progressPercent === 100 && (
            <button className="btn-gold flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Download Clearance Certificate
            </button>
          )}
          <Link
            href="/student/requirements"
            className="btn-secondary flex items-center justify-center gap-2"
          >
            View Requirements
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Timeline */}
        <div className="card-accent p-6 animate-fade-in-up delay-300">
          <h3 className="font-semibold text-lg text-cjc-navy mb-6">
            Clearance Timeline
          </h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {currentClearance.items
                .filter((item) => item.status === "approved")
                .sort(
                  (a, b) =>
                    new Date(b.approvedAt || 0).getTime() -
                    new Date(a.approvedAt || 0).getTime()
                )
                .map((item, index) => (
                  <div key={item.id} className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-success/10 border-4 border-white flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-cjc-navy">
                        {item.departmentName} Cleared
                      </p>
                      <p className="text-sm text-cjc-navy/60">
                        Approved by {item.approvedBy}
                      </p>
                      <p className="text-xs text-cjc-navy/40 mt-1">
                        {item.approvedAt &&
                          new Date(item.approvedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-cjc-blue/10 border-4 border-white flex items-center justify-center">
                  <FileText className="w-4 h-4 text-cjc-blue" />
                </div>
                <div>
                  <p className="font-medium text-cjc-navy">
                    Clearance Request Submitted
                  </p>
                  <p className="text-sm text-cjc-navy/60">
                    {currentClearance.academicYear} - {currentClearance.semester}
                  </p>
                  <p className="text-xs text-cjc-navy/40 mt-1">
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
