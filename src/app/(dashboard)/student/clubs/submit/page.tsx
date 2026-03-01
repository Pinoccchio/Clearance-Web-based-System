"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/Toast";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
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
  getClubById,
  getStudentClearanceRequests,
  getOrCreateClearanceItem,
  getPublishedRequirementsBySource,
  getSubmissionsByItem,
  getSystemSettings,
} from "@/lib/supabase";

interface ClubSource {
  id: string;
  name: string;
  code: string;
  type?: "academic" | "non-academic";
}

export default function StudentClubsSubmitPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItems, setClearanceItems] = useState<ClearanceItem[]>([]);
  const [requirementsBySource, setRequirementsBySource] = useState<Record<string, Requirement[]>>({});
  const [submissionsByItem, setSubmissionsByItem] = useState<Record<string, SubmissionWithRequirement[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (cancelled: { value: boolean }) => {
    if (!profile?.enrolled_clubs) return;

    try {
      // Parse enrolled club IDs
      const clubIds = profile.enrolled_clubs.split(",").map((id) => id.trim()).filter(Boolean);

      if (clubIds.length === 0) {
        setClubs([]);
        if (!cancelled.value) setIsLoading(false);
        return;
      }

      // Fetch system settings, clubs, and requests in parallel
      const [sys, clubsData, requests] = await Promise.all([
        getSystemSettings(),
        Promise.all(clubIds.map((id) => getClubById(id))),
        getStudentClearanceRequests(profile.id),
      ]);

      if (cancelled.value) return;

      setSystemSettings(sys);
      const validClubs = clubsData.filter((c): c is Club => c !== null);
      setClubs(validClubs);

      const active = requests.find((r) => r.status === "pending" || r.status === "in_progress") ?? null;
      setActiveRequest(active);

      // Fetch requirements and clearance items for each club
      const reqsBySource: Record<string, Requirement[]> = {};
      const items: ClearanceItem[] = [];
      const subsByItem: Record<string, SubmissionWithRequirement[]> = {};

      await Promise.all(
        validClubs.map(async (club) => {
          const reqs = await getPublishedRequirementsBySource("club", club.id);
          if (cancelled.value) return;
          reqsBySource[club.id] = reqs;

          if (active) {
            // Use getOrCreateClearanceItem to ensure clubs have clearance items
            // (DB trigger only creates them for departments/offices, not clubs)
            const item = await getOrCreateClearanceItem(active.id, "club", club.id);
            if (cancelled.value) return;
            if (item) {
              items.push(item);
              const subs = await getSubmissionsByItem(item.id);
              if (!cancelled.value) {
                subsByItem[item.id] = subs;
              }
            }
          }
        })
      );

      if (!cancelled.value) {
        setRequirementsBySource(reqsBySource);
        setClearanceItems(items);
        setSubmissionsByItem(subsByItem);
      }
    } catch (err) {
      if (!cancelled.value) {
        // Better error logging for debugging
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        console.error("Error loading club submit data:", errorMessage, err);
        showToast("error", "Load failed", "Failed to load submission data.");
      }
    } finally {
      if (!cancelled.value) setIsLoading(false);
    }
  }, [profile?.id, profile?.enrolled_clubs, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.enrolled_clubs) {
      setIsLoading(false);
      return;
    }

    const cancelled = { value: false };
    loadData(cancelled);
    return () => {
      cancelled.value = true;
    };
  }, [authLoading, loadData, profile?.enrolled_clubs]);

  const refreshData = useCallback(() => {
    const cancelled = { value: false };
    loadData(cancelled);
  }, [loadData]);

  useRealtimeRefresh("clearance_items", refreshData);
  useRealtimeRefresh("requirement_submissions", refreshData);

  function handleRequestCreated(req: ClearanceRequest) {
    setActiveRequest(req);
    const cancelled = { value: false };
    loadData(cancelled);
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — Clubs" subtitle="Submit your club clearance" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — Clubs" subtitle="Submit your club clearance" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Please log in to access this page.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile.enrolled_clubs || clubs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Submit — Clubs" subtitle="Submit your club clearance" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <Users className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">You are not enrolled in any clubs.</p>
          </Card>
        </div>
      </div>
    );
  }

  const sources: ClubSource[] = clubs.map((club) => ({
    id: club.id,
    name: club.name,
    code: club.code,
    type: club.type,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Submit — Clubs"
        subtitle={`${clubs.length} club${clubs.length !== 1 ? "s" : ""} enrolled`}
      />
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
          onUploadComplete={() => {
            const c = { value: false };
            loadData(c);
          }}
          loading={false}
        />
      </div>
    </div>
  );
}
