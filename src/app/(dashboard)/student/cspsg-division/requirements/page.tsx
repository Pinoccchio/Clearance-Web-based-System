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
  CspsgDivision,
  Requirement,
  getCspsgDivisionByCode,
  getPublishedRequirementsBySource,
} from "@/lib/supabase";

export default function CspsgDivisionRequirementsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [division, setDivision] = useState<CspsgDivision | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile?.csp_division) return;
    try {
      const d = await getCspsgDivisionByCode(profile.csp_division);
      setDivision(d);

      if (d) {
        const reqs = await getPublishedRequirementsBySource("csp_division", d.id);
        setRequirements(reqs);
      }
    } catch {
      showToast("error", "Load failed", "Failed to load requirements.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, profile?.csp_division, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.csp_division) { setIsLoading(false); return; }
    loadData();
  }, [authLoading, loadData]);

  useRealtimeRefresh('requirements', loadData);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSPSG Division Requirements" subtitle="Requirements for your CSPSG Division" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSPSG Division Requirements" subtitle="Requirements for your CSPSG Division" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Please log in to access this page.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile.csp_division) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSPSG Division Requirements" subtitle="Requirements for your CSPSG Division" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No CSPSG division assigned to your account.</p>
          </Card>
        </div>
      </div>
    );
  }

  const sources = division ? [{ id: division.id, name: division.name, code: division.code }] : [];
  const requirementsBySource = division ? { [division.id]: requirements } : {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="CSPSG Division Requirements"
        subtitle={division ? `${division.name} (${division.code})` : "Requirements for your CSPSG Division"}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RequirementsView
          sources={sources}
          requirementsBySource={requirementsBySource}
          loading={false}
          showSourceHeaders={false}
        />
      </div>
    </div>
  );
}
