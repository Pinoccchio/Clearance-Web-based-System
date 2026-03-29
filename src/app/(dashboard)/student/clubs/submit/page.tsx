"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  getSubmissionsByItems,
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
  const isRefreshingRef = useRef(false);
  const pendingRefreshRef = useRef(false);
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadGenRef = useRef(0);
  const mutationsInFlightRef = useRef(0);

  const loadData = useCallback(async (cancelled: { value: boolean }, silent = false) => {
    if (!profile?.enrolled_clubs) return;

    loadGenRef.current += 1;
    const gen = loadGenRef.current;

    try {
      // Parse enrolled club IDs
      const clubIds = profile.enrolled_clubs.split(",").map((id) => id.trim()).filter(Boolean);

      if (clubIds.length === 0) {
        setClubs([]);
        if (!cancelled.value && gen === loadGenRef.current) setIsLoading(false);
        return;
      }

      // Fetch system settings, clubs, and requests in parallel
      const [sys, clubsData, requests] = await Promise.all([
        getSystemSettings(),
        Promise.all(clubIds.map((id) => getClubById(id))),
        getStudentClearanceRequests(profile.id),
      ]);

      if (cancelled.value || gen !== loadGenRef.current) return;

      setSystemSettings(sys);
      const validClubs = clubsData.filter((c): c is Club => c !== null);
      setClubs(validClubs);

      const active = requests.find(
        (r) =>
          (r.status === "pending" || r.status === "in_progress" || r.status === "completed") &&
          r.academic_year === sys?.academic_year &&
          r.semester === sys?.current_semester
      ) ?? null;
      setActiveRequest(active);

      // Fetch requirements and clearance items for each club
      const reqsBySource: Record<string, Requirement[]> = {};
      const items: ClearanceItem[] = [];

      await Promise.all(
        validClubs.map(async (club) => {
          const reqs = await getPublishedRequirementsBySource("club", club.id);
          if (cancelled.value || gen !== loadGenRef.current) return;
          reqsBySource[club.id] = reqs;

          if (active) {
            // Use getOrCreateClearanceItem to ensure clubs have clearance items
            // (DB trigger only creates them for departments/offices, not clubs)
            const item = await getOrCreateClearanceItem(active.id, "club", club.id);
            if (cancelled.value || gen !== loadGenRef.current) return;
            if (item) {
              items.push(item);
            }
          }
        })
      );

      if (cancelled.value || gen !== loadGenRef.current) return;

      // Bulk-fetch all submissions in a single query
      const subsByItem = active && items.length > 0
        ? await getSubmissionsByItems(items.map((i) => i.id))
        : {};

      if (!cancelled.value && gen === loadGenRef.current) {
        setRequirementsBySource(reqsBySource);
        setClearanceItems(items);
        setSubmissionsByItem(subsByItem);
      }
    } catch (err) {
      if (!cancelled.value && gen === loadGenRef.current) {
        // Better error logging for debugging
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        console.error("Error loading club submit data:", errorMessage, err);
        if (!silent) showToast("error", "Load failed", "Failed to load submission data.");
      }
    } finally {
      if (!cancelled.value && gen === loadGenRef.current) setIsLoading(false);
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

  const debouncedRefresh = useCallback(() => {
    if (mutationsInFlightRef.current > 0) return;
    if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
    refreshDebounceRef.current = setTimeout(async () => {
      if (isRefreshingRef.current) {
        pendingRefreshRef.current = true;
        return;
      }
      isRefreshingRef.current = true;
      const cancelled = { value: false };
      await loadData(cancelled, true);
      isRefreshingRef.current = false;
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        const c = { value: false };
        isRefreshingRef.current = true;
        await loadData(c, true);
        isRefreshingRef.current = false;
      }
    }, 300);
  }, [loadData]);

  useRealtimeRefresh("clearance_items", refreshData);
  useRealtimeRefresh("requirement_submissions", debouncedRefresh, undefined, 400);

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
          onUploadComplete={debouncedRefresh}
          loading={false}
          mutationsInFlightRef={mutationsInFlightRef}
        />
      </div>
    </div>
  );
}
