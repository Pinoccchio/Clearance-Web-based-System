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
  CsgLgu,
  ClearanceRequest,
  ClearanceItem,
  Requirement,
  SystemSettings,
  getCsgLguByDepartmentCode,
  getStudentClearanceRequests,
  getClearanceItemForRequest,
  getRequirementsBySource,
  getSystemSettings,
} from "@/lib/supabase";

export default function CsgLguClearancePage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [lgu, setLgu] = useState<CsgLgu | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItem, setClearanceItem] = useState<ClearanceItem | null>(null);
  const [requirementCount, setRequirementCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile?.department) return;
    try {
      const [d, requests, sys] = await Promise.all([
        getCsgLguByDepartmentCode(profile.department),
        getStudentClearanceRequests(profile.id),
        getSystemSettings(),
      ]);

      setLgu(d);
      setSystemSettings(sys);

      const active = requests.find(
        (r) =>
          (r.status === "pending" || r.status === "in_progress" || r.status === "completed") &&
          r.academic_year === sys?.academic_year &&
          r.semester === sys?.current_semester
      ) ?? null;
      setActiveRequest(active);

      if (d) {
        const [lguReqs, item] = await Promise.all([
          getRequirementsBySource("csg_lgu", d.id),
          active ? getClearanceItemForRequest(active.id, "csg_lgu", d.id) : Promise.resolve(null),
        ]);
        setRequirementCount(lguReqs.length);
        setClearanceItem(item);
      }
    } catch (err) {
      showToast("error", "Load failed", "Failed to load clearance status.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, profile?.department, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.department) { setIsLoading(false); return; }
    loadData();
  }, [authLoading, loadData]);

  useRealtimeRefresh('clearance_items', loadData);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSG LGU Clearance" subtitle="Your CSG LGU clearance status" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSG LGU Clearance" subtitle="Your CSG LGU clearance status" />
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
        <Header title="CSG LGU Clearance" subtitle="Your CSG LGU clearance status" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No department assigned to your account.</p>
          </Card>
        </div>
      </div>
    );
  }

  const sources = lgu ? [{ id: lgu.id, name: lgu.name, code: lgu.code }] : [];
  const requirementCounts = lgu ? { [lgu.id]: requirementCount } : {};
  const clearanceItems = clearanceItem ? [clearanceItem] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="CSG LGU Clearance"
        subtitle={lgu ? `${lgu.name} (${lgu.code})` : "Your CSG LGU clearance status"}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClearanceStatusView
          sourceType="csg_lgu"
          sources={sources}
          requirementCounts={requirementCounts}
          clearanceRequest={activeRequest}
          clearanceItems={clearanceItems}
          loading={false}
          submitHref="/student/csg-lgu/submit"
        />
      </div>
    </div>
  );
}
