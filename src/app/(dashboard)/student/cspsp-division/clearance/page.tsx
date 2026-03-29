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
  CspspDivision,
  ClearanceRequest,
  ClearanceItem,
  Requirement,
  SystemSettings,
  getCspspDivisionByCode,
  getStudentClearanceRequests,
  getClearanceItemForRequest,
  getRequirementsBySource,
  getSystemSettings,
} from "@/lib/supabase";

export default function CspspDivisionClearancePage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [division, setDivision] = useState<CspspDivision | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItem, setClearanceItem] = useState<ClearanceItem | null>(null);
  const [requirementCount, setRequirementCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile?.cspsp_division) return;
    try {
      const [d, requests, sys] = await Promise.all([
        getCspspDivisionByCode(profile.cspsp_division),
        getStudentClearanceRequests(profile.id),
        getSystemSettings(),
      ]);

      setDivision(d);
      setSystemSettings(sys);

      const active = requests.find(
        (r) =>
          (r.status === "pending" || r.status === "in_progress" || r.status === "completed") &&
          r.academic_year === sys?.academic_year &&
          r.semester === sys?.current_semester
      ) ?? null;
      setActiveRequest(active);

      if (d) {
        const [divReqs, item] = await Promise.all([
          getRequirementsBySource("cspsp_division", d.id),
          active ? getClearanceItemForRequest(active.id, "cspsp_division", d.id) : Promise.resolve(null),
        ]);
        setRequirementCount(divReqs.length);
        setClearanceItem(item);
      }
    } catch (err) {
      showToast("error", "Load failed", "Failed to load clearance status.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, profile?.cspsp_division, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.cspsp_division) { setIsLoading(false); return; }
    loadData();
  }, [authLoading, loadData]);

  useRealtimeRefresh('clearance_items', loadData);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSPSP Division Clearance" subtitle="Your CSPSP Division clearance status" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSPSP Division Clearance" subtitle="Your CSPSP Division clearance status" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Please log in to access this page.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile.cspsp_division) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSPSP Division Clearance" subtitle="Your CSPSP Division clearance status" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No CSPSP division assigned to your account.</p>
          </Card>
        </div>
      </div>
    );
  }

  const sources = division ? [{ id: division.id, name: division.name, code: division.code }] : [];
  const requirementCounts = division ? { [division.id]: requirementCount } : {};
  const clearanceItems = clearanceItem ? [clearanceItem] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="CSPSP Division Clearance"
        subtitle={division ? `${division.name} (${division.code})` : "Your CSPSP Division clearance status"}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClearanceStatusView
          sourceType="cspsp_division"
          sources={sources}
          requirementCounts={requirementCounts}
          clearanceRequest={activeRequest}
          clearanceItems={clearanceItems}
          loading={false}
          submitHref="/student/cspsp-division/submit"
        />
      </div>
    </div>
  );
}
