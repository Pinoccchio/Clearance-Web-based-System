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
  Cspsg,
  Requirement,
  getActiveCspsg,
  getPublishedRequirementsBySource,
} from "@/lib/supabase";

export default function CspsgRequirementsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [cspsg, setCspsg] = useState<Cspsg | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const org = await getActiveCspsg();
      setCspsg(org);

      if (org) {
        const reqs = await getPublishedRequirementsBySource("cspsg", org.id, profile.year_level);
        setRequirements(reqs);
      }
    } catch {
      showToast("error", "Load failed", "Failed to load requirements.");
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
        <Header title="CSPSG Requirements" subtitle="CSP Student Government" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CSPSG Requirements" subtitle="CSP Student Government" />
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
  const requirementsBySource = cspsg ? { [cspsg.id]: requirements } : {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="CSPSG Requirements"
        subtitle={cspsg ? `${cspsg.name} (${cspsg.code})` : "CSP Student Government"}
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
