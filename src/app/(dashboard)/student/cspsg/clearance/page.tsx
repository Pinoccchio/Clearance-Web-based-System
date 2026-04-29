"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/Toast";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { Card } from "@/components/ui/Card";
import { AlertCircle, Loader2 } from "lucide-react";
import ClearanceStatusView from "@/components/student/ClearanceStatusView";
import {
  Cspsg,
  ClearanceRequest,
  ClearanceItem,
  Requirement,
  SystemSettings,
  getActiveCspsg,
  getStudentClearanceRequests,
  getClearanceItemForRequest,
  getRequirementsBySource,
  getSystemSettings,
} from "@/lib/supabase";

export default function CspsgClearancePage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [cspsg, setCspsg] = useState<Cspsg | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItem, setClearanceItem] = useState<ClearanceItem | null>(null);
  const [requirementCount, setRequirementCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [org, requests, sys] = await Promise.all([
        getActiveCspsg(),
        getStudentClearanceRequests(profile.id),
        getSystemSettings(),
      ]);

      setCspsg(org);
      setSystemSettings(sys);

      const active = requests.find(
        (r) =>
          (r.status === "pending" || r.status === "in_progress" || r.status === "completed") &&
          r.academic_year === sys?.academic_year &&
          r.semester === sys?.current_semester
      ) ?? null;
      setActiveRequest(active);

      if (org) {
        const [reqs, item] = await Promise.all([
          getRequirementsBySource("cspsg", org.id, profile.year_level),

          active ? getClearanceItemForRequest(active.id, "cspsg", org.id) : Promise.resolve(null),
        ]);
        setRequirementCount(reqs.length);
        setClearanceItem(item);
      }
    } catch {
      showToast("error", "Load failed", "Failed to load clearance status.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) { setIsLoading(false); return; }
    loadData();
  }, [authLoading, loadData]);

  useRealtimeRefresh('clearance_items', loadData);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSPSG Clearance" subtitle="CSP Student Government" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSPSG Clearance" subtitle="CSP Student Government" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Please log in to access this page.</p>
          </Card>
        </div>
      </div>
    );
  }

  const sources = cspsg ? [{ id: cspsg.id, name: cspsg.name, code: cspsg.code }] : [];
  const requirementCounts = cspsg ? { [cspsg.id]: requirementCount } : {};
  const clearanceItems = clearanceItem ? [clearanceItem] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="CSPSG Clearance"
        subtitle={cspsg ? `${cspsg.name} (${cspsg.code})` : "CSP Student Government"}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClearanceStatusView
          sourceType="cspsg"
          sources={sources}
          requirementCounts={requirementCounts}
          clearanceRequest={activeRequest}
          clearanceItems={clearanceItems}
          loading={false}
          submitHref="/student/cspsg/submit"
        />
      </div>
    </div>
  );
}
