"use client";

import { useState } from "react";
import Header from "@/components/layout/header";
import {
  CheckCircle2,
  Clock,
  Upload,
  FileText,
  Image,
  File,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
  CreditCard,
  Users,
  Building2,
  Heart,
} from "lucide-react";
import { mockUsers, departments, notifications } from "@/lib/mock-data";

interface Requirement {
  id: string;
  name: string;
  description: string;
  status: "submitted" | "pending" | "verified" | "rejected";
  dueDate?: string;
  submittedFile?: string;
}

interface DepartmentRequirements {
  departmentId: string;
  departmentName: string;
  icon: React.ReactNode;
  requirements: Requirement[];
}

export default function StudentRequirementsPage() {
  const user = mockUsers.student;
  const [expandedDept, setExpandedDept] = useState<string | null>("dept_001");

  const departmentRequirements: DepartmentRequirements[] = [
    {
      departmentId: "dept_001",
      departmentName: "Library",
      icon: <BookOpen className="w-5 h-5" />,
      requirements: [
        {
          id: "req_001",
          name: "Library Card Return",
          description: "Return your library card to the circulation desk",
          status: "verified",
        },
        {
          id: "req_002",
          name: "Book Return Confirmation",
          description: "All borrowed books must be returned",
          status: "verified",
        },
        {
          id: "req_003",
          name: "No Outstanding Fines",
          description: "Clear all library fines and penalties",
          status: "verified",
        },
      ],
    },
    {
      departmentId: "dept_002",
      departmentName: "Finance Office",
      icon: <CreditCard className="w-5 h-5" />,
      requirements: [
        {
          id: "req_004",
          name: "Tuition Payment",
          description: "Full payment of tuition and other fees",
          status: "verified",
        },
        {
          id: "req_005",
          name: "Laboratory Fees",
          description: "Payment of all laboratory fees",
          status: "verified",
        },
      ],
    },
    {
      departmentId: "dept_003",
      departmentName: "Registrar",
      icon: <FileText className="w-5 h-5" />,
      requirements: [
        {
          id: "req_006",
          name: "Enrollment Verification",
          description: "Verify your enrollment status for the current semester",
          status: "pending",
        },
        {
          id: "req_007",
          name: "Transcript Request Form",
          description: "Submit request form if you need transcript of records",
          status: "pending",
        },
      ],
    },
    {
      departmentId: "dept_004",
      departmentName: "Student Affairs",
      icon: <Users className="w-5 h-5" />,
      requirements: [
        {
          id: "req_008",
          name: "Organization Clearance",
          description: "Get clearance from all organizations you belong to",
          status: "verified",
        },
        {
          id: "req_009",
          name: "Discipline Record Check",
          description: "No pending disciplinary cases",
          status: "verified",
        },
      ],
    },
    {
      departmentId: "dept_005",
      departmentName: "CCIS Department",
      icon: <Building2 className="w-5 h-5" />,
      requirements: [
        {
          id: "req_010",
          name: "Equipment Return",
          description: "Return all borrowed equipment (keyboards, mice, etc.)",
          status: "pending",
        },
        {
          id: "req_011",
          name: "Laboratory Clearance",
          description: "Get clearance from computer laboratories",
          status: "pending",
        },
        {
          id: "req_012",
          name: "Project Documentation",
          description: "Submit final project documentation if applicable",
          status: "submitted",
          submittedFile: "final_project_docs.pdf",
        },
      ],
    },
    {
      departmentId: "dept_006",
      departmentName: "Guidance Office",
      icon: <Heart className="w-5 h-5" />,
      requirements: [
        {
          id: "req_013",
          name: "Exit Interview Form",
          description: "Complete the exit interview form (for graduating students)",
          status: "verified",
        },
        {
          id: "req_014",
          name: "Career Counseling Session",
          description: "Attend at least one career counseling session",
          status: "verified",
        },
      ],
    },
  ];

  const getStatusBadge = (status: Requirement["status"]) => {
    switch (status) {
      case "verified":
        return (
          <span className="badge badge-approved">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case "submitted":
        return (
          <span className="badge badge-in-progress">
            <Clock className="w-3 h-3" />
            Submitted
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
            <X className="w-3 h-3" />
            Rejected
          </span>
        );
    }
  };

  const totalRequirements = departmentRequirements.reduce(
    (acc, dept) => acc + dept.requirements.length,
    0
  );
  const completedRequirements = departmentRequirements.reduce(
    (acc, dept) =>
      acc +
      dept.requirements.filter((r) => r.status === "verified" || r.status === "submitted")
        .length,
    0
  );

  return (
    <div>
      <Header
        title="Requirements"
        subtitle="Complete all requirements for clearance"
        notifications={notifications}
      />

      <div className="p-6 space-y-6">
        {/* Progress Overview */}
        <div className="card-glass p-6 animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-cjc-navy mb-2">
                Requirements Progress
              </h2>
              <p className="text-cjc-navy/60">
                Complete all requirements to get cleared by each department
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-display font-bold text-cjc-gold">
                  {completedRequirements}/{totalRequirements}
                </p>
                <p className="text-sm text-cjc-navy/60">Requirements Completed</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cjc-gold to-cjc-gold-light rounded-full transition-all duration-500"
                style={{
                  width: `${(completedRequirements / totalRequirements) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Department Requirements Accordion */}
        <div className="space-y-4">
          {departmentRequirements.map((dept, index) => {
            const isExpanded = expandedDept === dept.departmentId;
            const completedCount = dept.requirements.filter(
              (r) => r.status === "verified" || r.status === "submitted"
            ).length;
            const allComplete = completedCount === dept.requirements.length;

            return (
              <div
                key={dept.departmentId}
                className={`card-glass overflow-hidden animate-fade-in-up ${
                  allComplete ? "border-l-4 border-l-success" : ""
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header */}
                <button
                  onClick={() =>
                    setExpandedDept(isExpanded ? null : dept.departmentId)
                  }
                  className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        allComplete
                          ? "bg-success/10 text-success"
                          : "bg-cjc-navy/5 text-cjc-navy"
                      }`}
                    >
                      {dept.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-cjc-navy">
                        {dept.departmentName}
                      </h3>
                      <p className="text-sm text-cjc-navy/60">
                        {completedCount} of {dept.requirements.length} requirements
                        completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {allComplete && (
                      <span className="badge badge-approved">
                        <CheckCircle2 className="w-3 h-3" />
                        Complete
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-cjc-navy/40" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-cjc-navy/40" />
                    )}
                  </div>
                </button>

                {/* Requirements List */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3 animate-fade-in-down">
                    {dept.requirements.map((req) => (
                      <div
                        key={req.id}
                        className={`p-4 rounded-xl border ${
                          req.status === "verified"
                            ? "bg-success/5 border-success/20"
                            : req.status === "submitted"
                            ? "bg-cjc-blue/5 border-cjc-blue/20"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-cjc-navy">
                                {req.name}
                              </h4>
                              {getStatusBadge(req.status)}
                            </div>
                            <p className="text-sm text-cjc-navy/60">
                              {req.description}
                            </p>
                            {req.submittedFile && (
                              <div className="mt-2 flex items-center gap-2 text-sm text-cjc-blue">
                                <FileText className="w-4 h-4" />
                                {req.submittedFile}
                              </div>
                            )}
                          </div>
                          {req.status === "pending" && (
                            <button className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              Upload
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="card-accent p-5 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-cjc-blue/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-cjc-blue" />
            </div>
            <div>
              <h4 className="font-semibold text-cjc-navy mb-1">Need Help?</h4>
              <p className="text-sm text-cjc-navy/70 mb-3">
                If you have questions about specific requirements or need assistance,
                please contact the respective department or visit the Student Affairs
                Office.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="#"
                  className="text-sm text-cjc-blue hover:text-cjc-blue-soft font-medium"
                >
                  Contact Support →
                </a>
                <span className="text-cjc-navy/30">|</span>
                <a
                  href="#"
                  className="text-sm text-cjc-blue hover:text-cjc-blue-soft font-medium"
                >
                  View FAQ →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
