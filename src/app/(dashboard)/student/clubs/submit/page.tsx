"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { AlertCircle, Loader2, Users } from "lucide-react";
import SubmitView from "@/components/student/SubmitView";
import {
  Club,
  ClearanceRequest,
  ClearanceItem,
  Requirement,
  SystemSettings,
  SubmissionWithRequirement,
  getAllClubs,
  getStudentClearanceRequests,
  getClearanceItemForRequest,
  getRequirementsByMultipleSources,
  getSubmissionsByItem,
  getSystemSettings,
} from "@/lib/supabase";

export default function ClubsSubmitPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [enrolledClubs, setEnrolledClubs] = useState<Club[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItems, setClearanceItems] = useState<ClearanceItem[]>([]);
  const [requirementsBySource, setRequirementsBySource] = useState<Record<string, Requirement[]>>({});
  const [submissionsByItem, setSubmissionsByItem] = useState<Record<string, SubmissionWithRequirement[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (cancelled: { value: boolean }) => {
    if (!profile) return;

    try {
      const enrolledIds = profile.enrolled_clubs
        ? profile.enrolled_clubs.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

      const [sys, allClubs, requests] = await Promise.all([
        getSystemSettings(),
        getAllClubs(),
        getStudentClearanceRequests(profile.id),
      ]);

      if (cancelled.value) return;

      setSystemSettings(sys);

      const clubs = allClubs.filter((c) => enrolledIds.includes(c.id));
      setEnrolledClubs(clubs);

      const active = requests.find((r) => r.status === "pending" || r.status === "in_progress") ?? null;
      setActiveRequest(active);

      if (clubs.length > 0) {
        const reqMap = await getRequirementsByMultipleSources(
          clubs.map((c) => ({ source_type: "club", source_id: c.id }))
        );
        const byId: Record<string, Requirement[]> = {};
        for (const [k, v] of Object.entries(reqMap)) {
          byId[k.split(":")[1]] = v;
        }

        if (cancelled.value) return;
        setRequirementsBySource(byId);

        if (active) {
          const items = await Promise.all(
            clubs.map((c) => getClearanceItemForRequest(active.id, "club", c.id))
          );
          const validItems = items.filter((i): i is ClearanceItem => i !== null);
          if (cancelled.value) return;
          setClearanceItems(validItems);

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
      }
    } catch (err) {
      if (!cancelled.value) showToast("error", "Load failed", "Failed to load club submission data.");
    } finally {
      if (!cancelled.value) setIsLoading(false);
    }
  }, [profile?.id, profile?.enrolled_clubs]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) { setIsLoading(false); return; }

    const cancelled = { value: false };
    loadData(cancelled);
    return () => { cancelled.value = true; };
  }, [authLoading, loadData]);

  function handleRequestCreated(req: ClearanceRequest) {
    setActiveRequest(req);
    const cancelled = { value: false };
    loadData(cancelled);
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — Clubs" subtitle="Submit your club clearances" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — Clubs" subtitle="Submit your club clearances" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Please log in to access this page.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (enrolledClubs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — Clubs" subtitle="Submit your club clearances" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-cjc-navy mb-1">Not Enrolled in Any Clubs</h3>
            <p className="text-sm text-gray-500">You are not enrolled in any clubs.</p>
          </Card>
        </div>
      </div>
    );
  }

  const sources = enrolledClubs.map((c) => ({ id: c.id, name: c.name, code: c.code }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Submit — Clubs" subtitle="Submit your club clearances" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubmitView
          sourceType="club"
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
