"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/Toast";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { Card } from "@/components/ui/Card";
import { AlertCircle, Loader2 } from "lucide-react";
import RequirementsView from "@/components/student/RequirementsView";
import {
  Office,
  Requirement,
  getAllOffices,
  getRequirementsByMultipleSources,
} from "@/lib/supabase";

export default function OfficesRequirementsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [offices, setOffices] = useState<Office[]>([]);
  const [requirementsBySource, setRequirementsBySource] = useState<Record<string, Requirement[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const allOffices = await getAllOffices();
      setOffices(allOffices);

      const reqMap = await getRequirementsByMultipleSources(
        allOffices.map((o) => ({ source_type: "office", source_id: o.id }))
      );

      // Re-key from "office:UUID" → "UUID"
      const byId: Record<string, Requirement[]> = {};
      for (const [k, v] of Object.entries(reqMap)) {
        byId[k.split(":")[1]] = v;
      }

      setRequirementsBySource(byId);
    } catch (err) {
      showToast("error", "Load failed", "Failed to load office requirements.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) { setIsLoading(false); return; }
    loadData();
  }, [authLoading, loadData]);

  useRealtimeRefresh('requirements', loadData);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Offices Requirements" subtitle="Requirements per office" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Offices Requirements" subtitle="Requirements per office" />
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
      <Header title="Offices Requirements" subtitle="Requirements per office" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RequirementsView
          sources={sources}
          requirementsBySource={requirementsBySource}
          loading={false}
          showSourceHeaders={true}
        />
      </div>
    </div>
  );
}
