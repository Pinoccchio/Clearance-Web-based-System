"use client";

import { useState } from "react";
import Header from "@/components/layout/header";
import {
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  Eye,
  X,
  Download,
} from "lucide-react";
import { mockUsers, mockClearanceRequests } from "@/lib/mock-data";
import { ClearanceRequest } from "@/lib/types";

export default function DepartmentApprovedPage() {
  const user = mockUsers.department;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ClearanceRequest | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filter for approved clearances (using completed status as approved)
  const approvedClearances = mockClearanceRequests.filter(
    (c) => c.status === "completed"
  );

  const filteredClearances = approvedClearances.filter(
    (c) =>
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (request: ClearanceRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  return (
    <div>
      <Header
        title="Approved Clearances"
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
          <button className="btn-secondary flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 animate-fade-in-up delay-100">
          <div className="card-glass p-4 text-center">
            <p className="text-2xl font-display font-bold text-success">
              {filteredClearances.length}
            </p>
            <p className="text-sm text-cjc-navy/60">Total Approved</p>
          </div>
          <div className="card-glass p-4 text-center">
            <p className="text-2xl font-display font-bold text-cjc-blue">12</p>
            <p className="text-sm text-cjc-navy/60">This Week</p>
          </div>
          <div className="card-glass p-4 text-center">
            <p className="text-2xl font-display font-bold text-cjc-navy">45</p>
            <p className="text-sm text-cjc-navy/60">This Month</p>
          </div>
        </div>

        {/* Approved List */}
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
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <CheckCircle2 className="w-6 h-6" />
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
                      Approved
                    </p>
                    <p className="text-sm font-medium text-cjc-navy">
                      {new Date(request.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 rounded-lg bg-success/10 text-success font-medium text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Approved
                  </span>
                  <button
                    onClick={() => handleViewDetails(request)}
                    className="px-4 py-2 rounded-lg bg-cjc-navy/10 text-cjc-navy font-medium text-sm hover:bg-cjc-navy/20 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>

              {/* Approval Details */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-4 text-sm text-cjc-navy/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Completed on {new Date(request.updatedAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredClearances.length === 0 && (
            <div className="card-glass p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-cjc-navy mb-2">
                No Approved Clearances
              </h3>
              <p className="text-cjc-navy/60">
                {searchQuery
                  ? "No clearances match your search criteria."
                  : "There are no approved clearances yet."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-cjc-navy/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-cjc-navy">
                    Clearance Details
                  </h3>
                  <p className="text-sm text-cjc-navy/60">Approved</p>
                </div>
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
                <div className="w-12 h-12 rounded-full bg-cjc-navy flex items-center justify-center text-white font-semibold">
                  {selectedRequest.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-medium text-cjc-navy text-lg">
                    {selectedRequest.studentName}
                  </p>
                  <p className="text-sm text-cjc-navy/60">
                    {selectedRequest.studentId} • {selectedRequest.studentCourse} • {selectedRequest.studentYear}
                  </p>
                </div>
              </div>
            </div>

            {/* Clearance Details */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-cjc-navy/60">Clearance Type</span>
                <span className="font-medium text-cjc-navy capitalize">{selectedRequest.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-cjc-navy/60">Academic Year</span>
                <span className="font-medium text-cjc-navy">{selectedRequest.academicYear}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-cjc-navy/60">Semester</span>
                <span className="font-medium text-cjc-navy">{selectedRequest.semester}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-cjc-navy/60">Submitted</span>
                <span className="font-medium text-cjc-navy">
                  {new Date(selectedRequest.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-cjc-navy/60">Completed</span>
                <span className="font-medium text-cjc-navy">
                  {new Date(selectedRequest.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Department Approvals */}
            <div className="mb-6">
              <h4 className="font-medium text-cjc-navy mb-3">Department Approvals</h4>
              <div className="space-y-2">
                {selectedRequest.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-success/5 rounded-lg"
                  >
                    <span className="text-sm text-cjc-navy">{item.departmentName}</span>
                    <div className="flex items-center gap-2 text-success text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approved</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-cjc-navy text-white rounded-lg font-semibold hover:bg-cjc-navy/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
