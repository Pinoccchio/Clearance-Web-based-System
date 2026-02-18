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
  Office,
  ClearanceRequest,
  ClearanceItem,
  Requirement,
  SystemSettings,
  SubmissionWithRequirement,
  getAllOffices,
  getStudentClearanceRequests,
  getClearanceItemForRequest,
  getPublishedRequirementsByMultipleSources,
  getSubmissionsByItem,
  getSystemSettings,
} from "@/lib/supabase";

export default function OfficesSubmitPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [offices, setOffices] = useState<Office[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItems, setClearanceItems] = useState<ClearanceItem[]>([]);
  const [requirementsBySource, setRequirementsBySource] = useState<Record<string, Requirement[]>>({});
  const [submissionsByItem, setSubmissionsByItem] = useState<Record<string, SubmissionWithRequirement[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (cancelled: { value: boolean }) => {
    if (!profile) return;

    try {
      const [sys, allOffices, requests] = await Promise.all([
        getSystemSettings(),
        getAllOffices(),
        getStudentClearanceRequests(profile.id),
      ]);

      if (cancelled.value) return;

      setSystemSettings(sys);
      setOffices(allOffices);

      const active = requests.find((r) => r.status === "pending" || r.status === "in_progress") ?? null;
      setActiveRequest(active);

      // Batch fetch requirements
      const reqMap = await getPublishedRequirementsByMultipleSources(
        allOffices.map((o) => ({ source_type: "office", source_id: o.id }))
      );
      const byId: Record<string, Requirement[]> = {};
      for (const [k, v] of Object.entries(reqMap)) {
        byId[k.split(":")[1]] = v;
      }

      if (cancelled.value) return;
      setRequirementsBySource(byId);

      if (active) {
        const items = await Promise.all(
          allOffices.map((o) => getClearanceItemForRequest(active.id, "office", o.id))
        );
        const validItems = items.filter((i): i is ClearanceItem => i !== null);
        if (cancelled.value) return;
        setClearanceItems(validItems);

        // Fetch submissions for all items
        const subsEntries = await Promise.all(
          validItems.map(async (item) => {
            const subs = await getSubmissionsByItem(item.id);
            return [item.id, subs] as [string, SubmissionWithRequirement[]];
          })
        );
        if (!cancelled.value) {
          setSubmissionsByItem(Object.fromEntries(subsEntries));
        }
      }
    } catch (err) {
      if (!cancelled.value) showToast("error", "Load failed", "Failed to load submission data.");
    } finally {
      if (!cancelled.value) setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) { setIsLoading(false); return; }

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
    const cancelled = { value: false };
    loadData(cancelled);
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — Offices" subtitle="Submit your office clearances" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — Offices" subtitle="Submit your office clearances" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Please log in to access this page.</p>
          </Card>
        </div>
      </div>
    );
  }

  const sources = offices.map((o) => ({ id: o.id, name: o.name, code: o.code }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Submit — Offices" subtitle="Submit your office clearances" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubmitView
          sourceType="office"
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
