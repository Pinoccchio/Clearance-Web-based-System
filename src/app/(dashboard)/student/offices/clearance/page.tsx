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
  Office,
  ClearanceRequest,
  ClearanceItem,
  getAllOffices,
  getStudentClearanceRequests,
  getClearanceItemForRequest,
  getRequirementsByMultipleSources,
} from "@/lib/supabase";

export default function OfficesClearancePage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [offices, setOffices] = useState<Office[]>([]);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItems, setClearanceItems] = useState<ClearanceItem[]>([]);
  const [requirementCounts, setRequirementCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const [allOffices, requests] = await Promise.all([
        getAllOffices(),
        getStudentClearanceRequests(profile.id),
      ]);

      setOffices(allOffices);

      const active = requests.find((r) => r.status === "pending" || r.status === "in_progress") ?? null;
      setActiveRequest(active);

      // Batch fetch requirement counts
      const reqMap = await getRequirementsByMultipleSources(
        allOffices.map((o) => ({ source_type: "office", source_id: o.id }))
      );
      const counts: Record<string, number> = {};
      for (const office of allOffices) {
        counts[office.id] = (reqMap[`office:${office.id}`] ?? []).length;
      }
      setRequirementCounts(counts);

      // Fetch clearance items per office
      if (active) {
        const items = await Promise.all(
          allOffices.map((o) => getClearanceItemForRequest(active.id, "office", o.id))
        );
        setClearanceItems(items.filter((i): i is ClearanceItem => i !== null));
      }
    } catch (err) {
      showToast("error", "Load failed", "Failed to load office clearance status.");
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
        <Header title="Offices Clearance" subtitle="Your clearance status per office" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Offices Clearance" subtitle="Your clearance status per office" />
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
      <Header title="Offices Clearance" subtitle="Your clearance status per office" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClearanceStatusView
          sourceType="office"
          sources={sources}
          requirementCounts={requirementCounts}
          clearanceRequest={activeRequest}
          clearanceItems={clearanceItems}
          loading={false}
          submitHref="/student/offices/submit"
        />
      </div>
    </div>
  );
}
