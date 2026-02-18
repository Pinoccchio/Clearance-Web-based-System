"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/Toast";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { Card } from "@/components/ui/Card";
import { AlertCircle, Loader2 } from "lucide-react";
import SubmitView from "@/components/student/SubmitView";
import {
  Department,
  ClearanceRequest,
  ClearanceItem,
  Requirement,
  SystemSettings,
  SubmissionWithRequirement,
  getDepartmentByCode,
  getStudentClearanceRequests,
  getClearanceItemForRequest,
  getPublishedRequirementsBySource,
  getSubmissionsByItem,
  getSystemSettings,
} from "@/lib/supabase";

export default function DepartmentSubmitPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [dept, setDept] = useState<Department | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItem, setClearanceItem] = useState<ClearanceItem | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [submissionsByItem, setSubmissionsByItem] = useState<Record<string, SubmissionWithRequirement[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (cancelled: { value: boolean }) => {
    if (!profile?.department) return;

    try {
      const [sys, d, requests] = await Promise.all([
        getSystemSettings(),
        getDepartmentByCode(profile.department),
        getStudentClearanceRequests(profile.id),
      ]);

      if (cancelled.value) return;

      setSystemSettings(sys);
      setDept(d);

      const active = requests.find((r) => r.status === "pending" || r.status === "in_progress") ?? null;
      setActiveRequest(active);

      if (d) {
        const reqs = await getPublishedRequirementsBySource("department", d.id);
        if (cancelled.value) return;
        setRequirements(reqs);

        if (active) {
          const item = await getClearanceItemForRequest(active.id, "department", d.id);
          if (cancelled.value) return;
          setClearanceItem(item);

          if (item) {
            const subs = await getSubmissionsByItem(item.id);
            if (!cancelled.value) {
              setSubmissionsByItem({ [item.id]: subs });
            }
          }
        }
      }
    } catch (err) {
      if (!cancelled.value) showToast("error", "Load failed", "Failed to load submission data.");
    } finally {
      if (!cancelled.value) setIsLoading(false);
    }
  }, [profile?.id, profile?.department]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.department) { setIsLoading(false); return; }

    const cancelled = { value: false };
    loadData(cancelled);
    return () => { cancelled.value = true; };
  }, [authLoading, loadData]);

  const refreshData = useCallback(() => {
    const cancelled = { value: false };
    loadData(cancelled);
  }, [loadData]);

  useRealtimeRefresh('clearance_items', refreshData);
  useRealtimeRefresh('requirement_submissions', refreshData);

  function handleRequestCreated(req: ClearanceRequest) {
    setActiveRequest(req);
    // Re-fetch items and submissions
    const cancelled = { value: false };
    loadData(cancelled);
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — Department" subtitle="Submit your department clearance" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — Department" subtitle="Submit your department clearance" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Please log in to access this page.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile.department) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — Department" subtitle="Submit your department clearance" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No department assigned to your account.</p>
          </Card>
        </div>
      </div>
    );
  }

  const sources = dept ? [{ id: dept.id, name: dept.name, code: dept.code }] : [];
  const requirementsBySource = dept ? { [dept.id]: requirements } : {};
  const clearanceItems = clearanceItem ? [clearanceItem] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Submit — Department"
        subtitle={dept ? `${dept.name} (${dept.code})` : "Submit your department clearance"}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubmitView
          sourceType="department"
          sources={sources}
          studentId={profile.id}
          systemSettings={systemSettings}
          requirementsBySource={requirementsBySource}
          clearanceRequest={activeRequest}
          clearanceItems={clearanceItems}
          submissionsByItem={submissionsByItem}
          onRequestCreated={handleRequestCreated}
          onUploadComplete={() => { const c = { value: false }; loadData(c); }}
          loading={false}
        />
      </div>
    </div>
  );
}
