"use client";

import Link from "next/link";
import Header from "@/components/layout/header";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  FileText,
  ArrowUpRight,
  Calendar,
  BookOpen,
  CreditCard,
  Users,
  Building2,
  Heart,
  Megaphone,
} from "lucide-react";
import { mockUsers, mockClearanceRequests, announcements, notifications } from "@/lib/mock-data";

export default function StudentDashboard() {
  const user = mockUsers.student;
  const currentClearance = mockClearanceRequests[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 border-green-200";
      case "pending":
        return "bg-blue-50 border-blue-200";
      case "rejected":
        return "bg-red-50 border-red-200";
      case "on_hold":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "badge-approved";
      case "pending":
        return "badge-pending";
      case "rejected":
        return "badge-rejected";
      case "on_hold":
        return "badge-on-hold";
      default:
        return "badge-neutral";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
      case "on_hold":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

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

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      <Header
        title="Student Dashboard"
        subtitle={`${greeting()}, ${user.firstName}!`}
        notifications={notifications}
      />

      <div className="p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="card p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-cjc-navy mb-1">
                Welcome back, {user.firstName}!
              </h2>
              <p className="text-gray-500 text-sm mb-3">
                {user.studentId} &bull; {user.course} &bull; {user.yearLevel}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-info">
                  <Calendar className="w-3 h-3" />
                  {currentClearance.academicYear}
                </span>
                <span className="badge badge-neutral">
                  {currentClearance.semester}
                </span>
              </div>
            </div>
            <Link
              href="/student/clearance"
              className="btn btn-primary self-start"
            >
              View My Clearance
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Progress Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <div className="card-accent p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-cjc-navy">
                  Clearance Progress
                </h3>
                <span className="text-sm text-gray-500">
                  {approvedCount} of {totalCount} departments cleared
                </span>
              </div>

              <div className="flex items-center gap-6">
                {/* Progress Bar */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-semibold text-cjc-navy">{progressPercent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Status Summary */}
                <div className="flex gap-4">
                  <div className="text-center px-4 py-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-2xl font-bold text-cjc-navy">{approvedCount}</span>
                    <p className="text-xs text-gray-500">Approved</p>
                  </div>
                  <div className="text-center px-4 py-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-2xl font-bold text-cjc-navy">
                      {totalCount - approvedCount}
                    </span>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Checklist */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-cjc-navy">
                  Department Status
                </h3>
                <Link
                  href="/student/clearance"
                  className="text-sm text-cjc-blue hover:underline font-medium flex items-center gap-1"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {currentClearance.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(
                      item.status
                    )}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-600">
                        {getDeptIcon(item.departmentName)}
                      </div>
                      <div>
                        <p className="font-medium text-cjc-navy">
                          {item.departmentName}
                        </p>
                        {item.approvedBy && (
                          <p className="text-xs text-gray-500">
                            Approved by {item.approvedBy}
                          </p>
                        )}
                        {item.remarks && (
                          <p className="text-xs text-amber-600">{item.remarks}</p>
                        )}
                      </div>
                    </div>
                    <span className={`badge ${getStatusBadge(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="capitalize">{item.status.replace("_", " ")}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Action Required */}
            {currentClearance.items.filter((i) => i.status === "pending").length > 0 && (
              <div className="card-accent p-5 border-l-amber-500">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-cjc-navy mb-1">
                      Action Required
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      You have {currentClearance.items.filter((i) => i.status === "pending").length} pending clearances that need your attention.
                    </p>
                    <Link
                      href="/student/requirements"
                      className="text-sm text-cjc-blue font-medium hover:underline"
                    >
                      View Requirements &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Announcements */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-cjc-navy flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-cjc-gold" />
                  Announcements
                </h3>
              </div>
              <div className="space-y-4">
                {announcements.slice(0, 3).map((announcement) => (
                  <div
                    key={announcement.id}
                    className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start gap-2 mb-1">
                      {announcement.priority === "urgent" && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded">
                          URGENT
                        </span>
                      )}
                      {announcement.priority === "high" && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-medium rounded">
                          IMPORTANT
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-cjc-navy text-sm mb-1">
                      {announcement.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {announcement.author} &bull;{" "}
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="#"
                className="block text-center text-sm text-cjc-blue font-medium mt-4 hover:underline"
              >
                View All Announcements
              </Link>
            </div>

            {/* Quick Links */}
            <div className="card p-5">
              <h3 className="font-semibold text-cjc-navy mb-4">Quick Links</h3>
              <div className="space-y-1">
                <Link
                  href="/student/clearance"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-cjc-navy">My Clearance</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  href="/student/requirements"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-cjc-navy">Requirements</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  href="/student/history"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-cjc-navy">History</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
