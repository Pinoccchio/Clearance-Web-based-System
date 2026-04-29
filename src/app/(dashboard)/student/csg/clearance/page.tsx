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
  Csg,
  ClearanceRequest,
  ClearanceItem,
  SystemSettings,
  getActiveCsg,
  getStudentClearanceRequests,
  getClearanceItemForRequest,
  getRequirementsBySource,
  getSystemSettings,
} from "@/lib/supabase";

export default function CsgClearancePage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [csg, setCsg] = useState<Csg | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItem, setClearanceItem] = useState<ClearanceItem | null>(null);
  const [requirementCount, setRequirementCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [d, requests, sys] = await Promise.all([
        getActiveCsg(),
        getStudentClearanceRequests(profile.id),
        getSystemSettings(),
      ]);

      setCsg(d);
      setSystemSettings(sys);

      const active = requests.find(
        (r) =>
          (r.status === "pending" || r.status === "in_progress" || r.status === "completed") &&
          r.academic_year === sys?.academic_year &&
          r.semester === sys?.current_semester
      ) ?? null;
      setActiveRequest(active);

      if (d) {
        const [csgReqs, item] = await Promise.all([
          getRequirementsBySource("csg", d.id, profile.year_level),

          active ? getClearanceItemForRequest(active.id, "csg", d.id) : Promise.resolve(null),
        ]);
        setRequirementCount(csgReqs.length);
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
    if (!profile?.id) { setIsLoading(false); return; }
    loadData();
  }, [authLoading, loadData]);

  useRealtimeRefresh('clearance_items', loadData);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSG Clearance" subtitle="Central Student Government" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSG Clearance" subtitle="Central Student Government" />
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
  const requirementCounts = csg ? { [csg.id]: requirementCount } : {};
  const clearanceItems = clearanceItem ? [clearanceItem] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="CSG Clearance"
        subtitle={csg ? `${csg.name} (${csg.code})` : "Central Student Government"}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClearanceStatusView
          sourceType="csg"
          sources={sources}
          requirementCounts={requirementCounts}
          clearanceRequest={activeRequest}
          clearanceItems={clearanceItems}
          loading={false}
          submitHref="/student/csg/submit"
        />
      </div>
    </div>
  );
}
