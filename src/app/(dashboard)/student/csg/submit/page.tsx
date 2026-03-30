"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/Toast";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { Card } from "@/components/ui/Card";
import { AlertCircle, Loader2 } from "lucide-react";
import SubmitView from "@/components/student/SubmitView";
import {
  Csg,
  ClearanceRequest,
  ClearanceItem,
  Requirement,
  SystemSettings,
  SubmissionWithRequirement,
  getActiveCsg,
  getStudentClearanceRequests,
  getClearanceItemForRequest,
  getPublishedRequirementsBySource,
  getSubmissionsByItems,
  getSystemSettings,
} from "@/lib/supabase";

export default function CsgSubmitPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [csg, setCsg] = useState<Csg | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItem, setClearanceItem] = useState<ClearanceItem | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [submissionsByItem, setSubmissionsByItem] = useState<Record<string, SubmissionWithRequirement[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const isRefreshingRef = useRef(false);
  const pendingRefreshRef = useRef(false);
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadGenRef = useRef(0);
  const mutationsInFlightRef = useRef(0);

  const loadData = useCallback(async (cancelled: { value: boolean }, silent = false) => {
    if (!profile?.id) return;

    loadGenRef.current += 1;
    const gen = loadGenRef.current;

    try {
      const [sys, d, requests] = await Promise.all([
        getSystemSettings(),
        getActiveCsg(),
        getStudentClearanceRequests(profile.id),
      ]);

      if (cancelled.value || gen !== loadGenRef.current) return;

      setSystemSettings(sys);
      setCsg(d);

      const active = requests.find(
        (r) =>
          (r.status === "pending" || r.status === "in_progress" || r.status === "completed") &&
          r.academic_year === sys?.academic_year &&
          r.semester === sys?.current_semester
      ) ?? null;
      setActiveRequest(active);

      if (d) {
        const reqs = await getPublishedRequirementsBySource("csg", d.id);
        if (cancelled.value || gen !== loadGenRef.current) return;
        setRequirements(reqs);

        if (active) {
          const item = await getClearanceItemForRequest(active.id, "csg", d.id);
          if (cancelled.value || gen !== loadGenRef.current) return;
          setClearanceItem(item);

          if (item) {
            const subsByItem = await getSubmissionsByItems([item.id]);
            if (!cancelled.value && gen === loadGenRef.current) {
              setSubmissionsByItem(subsByItem);
            }
          }
        }
      }
    } catch {
      if (!cancelled.value && gen === loadGenRef.current && !silent) {
        showToast("error", "Load failed", "Failed to load submission data.");
      }
    } finally {
      if (!cancelled.value && gen === loadGenRef.current) setIsLoading(false);
    }
  }, [profile?.id, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.id) { setIsLoading(false); return; }

    const cancelled = { value: false };
    loadData(cancelled);
    return () => { cancelled.value = true; };
  }, [authLoading, loadData]);

  const refreshData = useCallback(() => {
    const cancelled = { value: false };
    loadData(cancelled);
  }, [loadData]);

  const debouncedRefresh = useCallback(() => {
    if (mutationsInFlightRef.current > 0) return;
    if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
    refreshDebounceRef.current = setTimeout(async () => {
      if (isRefreshingRef.current) {
        pendingRefreshRef.current = true;
        return;
      }
      isRefreshingRef.current = true;
      const cancelled = { value: false };
      await loadData(cancelled, true);
      isRefreshingRef.current = false;
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        const c = { value: false };
        isRefreshingRef.current = true;
        await loadData(c, true);
        isRefreshingRef.current = false;
      }
    }, 300);
  }, [loadData]);

  useRealtimeRefresh('clearance_items', refreshData);
  useRealtimeRefresh('requirement_submissions', debouncedRefresh, undefined, 400);

  function handleRequestCreated(req: ClearanceRequest) {
    setActiveRequest(req);
    const cancelled = { value: false };
    loadData(cancelled);
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — CSG" subtitle="Central Student Government" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — CSG" subtitle="Central Student Government" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Please log in to access this page.</p>
          </Card>
        </div>
      </div>
    );
  }

  const sources = csg ? [{ id: csg.id, name: csg.name, code: csg.code }] : [];
  const requirementsBySource = csg ? { [csg.id]: requirements } : {};
  const clearanceItems = clearanceItem ? [clearanceItem] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Submit — CSG"
        subtitle={csg ? `${csg.name} (${csg.code})` : "Central Student Government"}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubmitView
          sourceType="csg"
          sources={sources}
          studentId={profile.id}
          systemSettings={systemSettings}
          requirementsBySource={requirementsBySource}
          clearanceRequest={activeRequest}
          clearanceItems={clearanceItems}
          submissionsByItem={submissionsByItem}
          onRequestCreated={handleRequestCreated}
          onUploadComplete={debouncedRefresh}
          loading={false}
          mutationsInFlightRef={mutationsInFlightRef}
        />
      </div>
    </div>
  );
}
