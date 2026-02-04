"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Upload,
  FileText,
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
import { mockUsers } from "@/lib/mock-data";

interface Requirement {
  id: string;
  name: string;
  description: string;
  status: "submitted" | "pending" | "verified" | "rejected";
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
        { id: "req_001", name: "Library Card Return", description: "Return your library card to the circulation desk", status: "verified" },
        { id: "req_002", name: "Book Return Confirmation", description: "All borrowed books must be returned", status: "verified" },
        { id: "req_003", name: "No Outstanding Fines", description: "Clear all library fines and penalties", status: "verified" },
      ],
    },
    {
      departmentId: "dept_002",
      departmentName: "Finance Office",
      icon: <CreditCard className="w-5 h-5" />,
      requirements: [
        { id: "req_004", name: "Tuition Payment", description: "Full payment of tuition and other fees", status: "verified" },
        { id: "req_005", name: "Laboratory Fees", description: "Payment of all laboratory fees", status: "verified" },
      ],
    },
    {
      departmentId: "dept_003",
      departmentName: "Registrar",
      icon: <FileText className="w-5 h-5" />,
      requirements: [
        { id: "req_006", name: "Enrollment Verification", description: "Verify your enrollment status for the current semester", status: "pending" },
        { id: "req_007", name: "Transcript Request Form", description: "Submit request form if you need transcript of records", status: "pending" },
      ],
    },
    {
      departmentId: "dept_004",
      departmentName: "Student Affairs",
      icon: <Users className="w-5 h-5" />,
      requirements: [
        { id: "req_008", name: "Organization Clearance", description: "Get clearance from all organizations you belong to", status: "verified" },
        { id: "req_009", name: "Discipline Record Check", description: "No pending disciplinary cases", status: "verified" },
      ],
    },
    {
      departmentId: "dept_005",
      departmentName: "CCIS Department",
      icon: <Building2 className="w-5 h-5" />,
      requirements: [
        { id: "req_010", name: "Equipment Return", description: "Return all borrowed equipment (keyboards, mice, etc.)", status: "pending" },
        { id: "req_011", name: "Laboratory Clearance", description: "Get clearance from computer laboratories", status: "pending" },
        { id: "req_012", name: "Project Documentation", description: "Submit final project documentation if applicable", status: "submitted", submittedFile: "final_project_docs.pdf" },
      ],
    },
    {
      departmentId: "dept_006",
      departmentName: "Guidance Office",
      icon: <Heart className="w-5 h-5" />,
      requirements: [
        { id: "req_013", name: "Exit Interview Form", description: "Complete the exit interview form (for graduating students)", status: "verified" },
        { id: "req_014", name: "Career Counseling Session", description: "Attend at least one career counseling session", status: "verified" },
      ],
    },
  ];

  const totalRequirements = departmentRequirements.reduce((acc, dept) => acc + dept.requirements.length, 0);
  const completedRequirements = departmentRequirements.reduce(
    (acc, dept) => acc + dept.requirements.filter((r) => r.status === "verified" || r.status === "submitted").length,
    0
  );

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Complete all requirements for clearance</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">Requirements</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Progress Overview */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-cjc-navy text-lg">Requirements Progress</h2>
              <p className="text-sm text-warm-muted mt-1">Complete all requirements to get cleared by each department</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-cjc-gold">{completedRequirements}/{totalRequirements}</p>
              <p className="text-sm text-warm-muted">Requirements Completed</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="progress-bar h-3">
              <div
                className="progress-bar-fill"
                style={{ width: `${(completedRequirements / totalRequirements) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Department Requirements */}
        <div className="space-y-3">
          {departmentRequirements.map((dept) => {
            const isExpanded = expandedDept === dept.departmentId;
            const completedCount = dept.requirements.filter((r) => r.status === "verified" || r.status === "submitted").length;
            const allComplete = completedCount === dept.requirements.length;

            return (
              <div
                key={dept.departmentId}
                className={`card overflow-hidden ${allComplete ? "border-l-4 border-l-success" : ""}`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedDept(isExpanded ? null : dept.departmentId)}
                  className="w-full p-4 flex items-center justify-between hover:bg-surface-warm transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${allComplete ? "bg-success/10 text-success" : "bg-surface-warm text-cjc-navy"}`}>
                      {dept.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-cjc-navy">{dept.departmentName}</h3>
                      <p className="text-sm text-warm-muted">{completedCount} of {dept.requirements.length} completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {allComplete && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Complete
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-warm-muted" /> : <ChevronDown className="w-5 h-5 text-warm-muted" />}
                  </div>
                </button>

                {/* Requirements List */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {dept.requirements.map((req) => (
                      <div
                        key={req.id}
                        className={`p-4 rounded-lg border ${
                          req.status === "verified" ? "bg-success/5 border-success/20" :
                          req.status === "submitted" ? "bg-cjc-blue/5 border-cjc-blue/20" :
                          "bg-surface-warm border-border-warm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-cjc-navy">{req.name}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                req.status === "verified" ? "bg-success/10 text-success" :
                                req.status === "submitted" ? "bg-cjc-blue/10 text-cjc-blue" :
                                req.status === "pending" ? "bg-pending/10 text-pending" :
                                "bg-danger/10 text-danger"
                              }`}>
                                {req.status === "verified" && <CheckCircle2 className="w-3 h-3" />}
                                {req.status === "submitted" && <Clock className="w-3 h-3" />}
                                {req.status === "pending" && <Clock className="w-3 h-3" />}
                                {req.status === "rejected" && <X className="w-3 h-3" />}
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-warm-muted">{req.description}</p>
                            {req.submittedFile && (
                              <div className="mt-2 flex items-center gap-2 text-sm text-cjc-blue">
                                <FileText className="w-4 h-4" />
                                {req.submittedFile}
                              </div>
                            )}
                          </div>
                          {req.status === "pending" && (
                            <button className="btn btn-primary text-sm py-2 px-4">
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

        {/* Help */}
        <div className="card-accent p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-cjc-blue/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-cjc-blue" />
            </div>
            <div>
              <h4 className="font-semibold text-cjc-navy mb-1">Need Help?</h4>
              <p className="text-sm text-warm-muted mb-3">
                If you have questions about specific requirements, please contact the respective department or visit the Student Affairs Office.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#" className="text-sm text-cjc-blue font-medium hover:underline">Contact Support →</a>
                <a href="#" className="text-sm text-cjc-blue font-medium hover:underline">View FAQ →</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
