"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  AlertCircle,
  ArrowLeft,
  Building2,
  BookOpen,
  CreditCard,
  Users,
  Heart,
  GraduationCap,
} from "lucide-react";
import { mockUsers } from "@/lib/mock-data";

export default function SubmitClearancePage() {
  const router = useRouter();
  const user = mockUsers.student;
  const [clearanceType, setClearanceType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const clearanceTypes = [
    { value: "semester", label: "Semester Clearance", description: "Required at the end of each semester" },
    { value: "graduation", label: "Graduation Clearance", description: "Required for graduating students" },
    { value: "transfer", label: "Transfer Clearance", description: "Required when transferring schools" },
  ];

  const requiredDepartments = [
    { name: "Library", icon: <BookOpen className="w-5 h-5" />, description: "Return all borrowed materials" },
    { name: "Finance Office", icon: <CreditCard className="w-5 h-5" />, description: "Settle all financial obligations" },
    { name: "Registrar", icon: <FileText className="w-5 h-5" />, description: "Verify academic records" },
    { name: "Student Affairs", icon: <Users className="w-5 h-5" />, description: "Clear disciplinary records" },
    { name: "CCIS Department", icon: <Building2 className="w-5 h-5" />, description: "Department-specific requirements" },
    { name: "Guidance Office", icon: <Heart className="w-5 h-5" />, description: "Exit interview and clearance" },
  ];

  const handleSubmit = async () => {
    if (!clearanceType) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">Request new clearance</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">Submit Clearance</h1>
          </div>
        </header>
        <div className="p-6">
          <div className="card max-w-2xl mx-auto p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">Clearance Request Submitted!</h2>
            <p className="text-warm-muted mb-6">
              Your {clearanceTypes.find(t => t.value === clearanceType)?.label} request has been submitted successfully.
              You can track your progress in the clearance tracker.
            </p>
            <div className="flex justify-center gap-3">
              <button className="btn btn-primary" onClick={() => router.push("/student/clearance")}>
                Track Progress
              </button>
              <button className="btn btn-secondary" onClick={() => router.push("/student")}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5">
          <p className="text-sm text-warm-muted">Request new clearance</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">Submit Clearance</h1>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-warm-muted hover:text-cjc-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          {/* Student Info */}
          <div className="card-accent p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-cjc-navy flex items-center justify-center text-white font-semibold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <h2 className="font-semibold text-cjc-navy">
                  {user.firstName} {user.middleName?.[0]}. {user.lastName}
                </h2>
                <p className="text-warm-muted text-sm font-mono">{user.studentId}</p>
                <p className="text-sm text-cjc-navy">{user.course} · {user.yearLevel}</p>
              </div>
            </div>
          </div>

          {/* Select Clearance Type */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-cjc-gold" />
              <h3 className="font-display font-bold text-cjc-navy">Select Clearance Type</h3>
            </div>

            <div className="space-y-2">
              {clearanceTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setClearanceType(type.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    clearanceType === type.value
                      ? "border-cjc-gold bg-cjc-gold/5"
                      : "border-border-warm hover:border-cjc-gold/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-cjc-navy">{type.label}</p>
                      <p className="text-sm text-warm-muted">{type.description}</p>
                    </div>
                    {clearanceType === type.value && (
                      <CheckCircle2 className="w-5 h-5 text-cjc-gold" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Required Departments */}
          {clearanceType && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cjc-gold" />
                  <h3 className="font-display font-bold text-cjc-navy">Required Departments</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cjc-blue/10 text-cjc-blue font-medium">
                  {requiredDepartments.length} departments
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {requiredDepartments.map((dept) => (
                  <div
                    key={dept.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-surface-warm"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-cjc-navy border border-border-warm">
                      {dept.icon}
                    </div>
                    <div>
                      <p className="font-medium text-cjc-navy text-sm">{dept.name}</p>
                      <p className="text-xs text-warm-muted">{dept.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-cjc-blue/5 border border-cjc-blue/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-cjc-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-cjc-navy">Important Note</p>
                    <p className="text-sm text-warm-muted mt-1">
                      Once submitted, each department will review your clearance. Processing time varies.
                      Make sure you have completed all requirements before submission.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {clearanceType && (
            <div className="flex justify-end gap-3">
              <button className="btn btn-secondary" onClick={() => router.back()}>
                Cancel
              </button>
              <button
                className="btn btn-gold"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Submit Clearance Request
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
