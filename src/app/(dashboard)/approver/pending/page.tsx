"use client";

import { useState } from "react";
import Header from "@/components/layout/header";
import {
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  Search,
  Filter,
  User,
  Calendar,
  FileText,
  ChevronRight,
  X,
  AlertCircle,
} from "lucide-react";
import { mockUsers, mockClearanceRequests, mockStudents } from "@/lib/mock-data";
import { ClearanceRequest } from "@/lib/types";

export default function ApproverPendingPage() {
  const user = mockUsers.approver;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ClearanceRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "hold" | null>(null);
  const [remarks, setRemarks] = useState("");

  // Filter for pending clearances
  const pendingClearances = mockClearanceRequests.filter(
    (c) => c.status === "in_progress" || c.status === "pending"
  );

  const filteredClearances = pendingClearances.filter(
    (c) =>
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = (request: ClearanceRequest, action: "approve" | "reject" | "hold") => {
    setSelectedRequest(request);
    setActionType(action);
    setShowModal(true);
    setRemarks("");
  };

  const confirmAction = () => {
    // In real app, this would call an API
    console.log(`Action: ${actionType}`, selectedRequest?.id, remarks);
    setShowModal(false);
    setSelectedRequest(null);
    setActionType(null);
    setRemarks("");
  };

  const getActionStyles = () => {
    switch (actionType) {
      case "approve":
        return {
          bg: "bg-success",
          text: "text-success",
          bgLight: "bg-success/10",
          icon: <CheckCircle2 className="w-6 h-6" />,
          title: "Approve Clearance",
          message: "Are you sure you want to approve this clearance request?",
        };
      case "reject":
        return {
          bg: "bg-danger",
          text: "text-danger",
          bgLight: "bg-danger/10",
          icon: <XCircle className="w-6 h-6" />,
          title: "Reject Clearance",
          message: "Please provide a reason for rejection.",
        };
      case "hold":
        return {
          bg: "bg-warning",
          text: "text-warning",
          bgLight: "bg-warning/10",
          icon: <PauseCircle className="w-6 h-6" />,
          title: "Put On Hold",
          message: "Please provide a reason for putting this request on hold.",
        };
      default:
        return null;
    }
  };

  return (
    <div>
      <Header
        title="Pending Reviews"
        subtitle={`${user.department} Department`}
      />

      <div className="p-6 space-y-6">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-12"
            />
          </div>
          <button className="btn-secondary flex items-center justify-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 animate-fade-in-up delay-100">
          <div className="card-glass p-4 text-center">
            <p className="text-2xl font-display font-bold text-pending">
              {filteredClearances.length}
            </p>
            <p className="text-sm text-cjc-navy/60">Pending</p>
          </div>
          <div className="card-glass p-4 text-center">
            <p className="text-2xl font-display font-bold text-success">8</p>
            <p className="text-sm text-cjc-navy/60">Approved Today</p>
          </div>
          <div className="card-glass p-4 text-center">
            <p className="text-2xl font-display font-bold text-warning">3</p>
            <p className="text-sm text-cjc-navy/60">On Hold</p>
          </div>
        </div>

        {/* Pending List */}
        <div className="space-y-4">
          {filteredClearances.map((request, index) => (
            <div
              key={request.id}
              className="card-glass p-6 animate-fade-in-up card-hover"
              style={{ animationDelay: `${(index + 2) * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Student Info */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cjc-navy to-cjc-navy-light flex items-center justify-center text-white text-lg font-semibold">
                    {request.studentName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-cjc-navy text-lg">
                      {request.studentName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cjc-navy/60">
                      <span className="font-mono">{request.studentId}</span>
                      <span>{request.studentCourse}</span>
                      <span>{request.studentYear}</span>
                    </div>
                  </div>
                </div>

                {/* Clearance Info */}
                <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                  <div className="text-center">
                    <p className="text-xs text-cjc-navy/50 uppercase tracking-wide">
                      Type
                    </p>
                    <p className="text-sm font-medium text-cjc-navy capitalize">
                      {request.type}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-cjc-navy/50 uppercase tracking-wide">
                      Period
                    </p>
                    <p className="text-sm font-medium text-cjc-navy">
                      {request.semester}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-cjc-navy/50 uppercase tracking-wide">
                      Submitted
                    </p>
                    <p className="text-sm font-medium text-cjc-navy">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(request, "approve")}
                    className="px-4 py-2 rounded-lg bg-success/10 text-success font-medium text-sm hover:bg-success/20 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(request, "hold")}
                    className="px-4 py-2 rounded-lg bg-warning/10 text-warning font-medium text-sm hover:bg-warning/20 transition-colors flex items-center gap-2"
                  >
                    <PauseCircle className="w-4 h-4" />
                    Hold
                  </button>
                  <button
                    onClick={() => handleAction(request, "reject")}
                    className="px-4 py-2 rounded-lg bg-danger/10 text-danger font-medium text-sm hover:bg-danger/20 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>

              {/* Requirements Status */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-cjc-navy/60 mb-2">Department Requirements:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                    No Outstanding Balance
                  </span>
                  <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                    No Borrowed Items
                  </span>
                  <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                    ID Verified
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredClearances.length === 0 && (
            <div className="card-glass p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-cjc-navy mb-2">
                All Caught Up!
              </h3>
              <p className="text-cjc-navy/60">
                There are no pending clearance requests to review.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showModal && selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-cjc-navy/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${getActionStyles()?.bgLight} flex items-center justify-center ${getActionStyles()?.text}`}>
                  {getActionStyles()?.icon}
                </div>
                <h3 className="font-semibold text-lg text-cjc-navy">
                  {getActionStyles()?.title}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Student Info */}
            <div className="p-4 bg-gray-50 rounded-xl mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cjc-navy/10 flex items-center justify-center text-cjc-navy font-semibold text-sm">
                  {selectedRequest.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-medium text-cjc-navy">
                    {selectedRequest.studentName}
                  </p>
                  <p className="text-sm text-cjc-navy/60">
                    {selectedRequest.studentId} • {selectedRequest.studentCourse}
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            <p className="text-cjc-navy/70 mb-4">{getActionStyles()?.message}</p>

            {/* Remarks Input */}
            {(actionType === "reject" || actionType === "hold") && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-cjc-navy mb-2">
                  Remarks <span className="text-danger">*</span>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter your remarks..."
                  className="input-base min-h-[100px] resize-none"
                  required
                />
              </div>
            )}

            {actionType === "approve" && (
              <div className="mb-6 p-4 bg-success/5 border border-success/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-success">
                    This will mark the {user.department} clearance as approved for
                    this student.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={
                  (actionType === "reject" || actionType === "hold") && !remarks
                }
                className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getActionStyles()?.bg} hover:opacity-90`}
              >
                Confirm {actionType === "approve" ? "Approval" : actionType === "reject" ? "Rejection" : "Hold"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
