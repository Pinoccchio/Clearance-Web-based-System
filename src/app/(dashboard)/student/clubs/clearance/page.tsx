"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/Toast";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { Card } from "@/components/ui/Card";
import { AlertCircle, Loader2, Users } from "lucide-react";
import ClearanceStatusView from "@/components/student/ClearanceStatusView";
import {
  Club,
  ClearanceRequest,
  ClearanceItem,
  SystemSettings,
  getClubById,
  getStudentClearanceRequests,
  getOrCreateClearanceItem,
  getPublishedRequirementsBySource,
  getSystemSettings,
} from "@/lib/supabase";

interface ClubSource {
  id: string;
  name: string;
  code: string;
  type?: "academic" | "non-academic";
}

export default function StudentClubsClearancePage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItems, setClearanceItems] = useState<ClearanceItem[]>([]);
  const [requirementCounts, setRequirementCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile?.enrolled_clubs) return;

    try {
      // Parse enrolled club IDs
      const clubIds = profile.enrolled_clubs.split(",").map((id) => id.trim()).filter(Boolean);

      if (clubIds.length === 0) {
        setClubs([]);
        setIsLoading(false);
        return;
      }

      // Fetch all clubs, requests, and system settings in parallel
      const [clubsData, requests, sys] = await Promise.all([
        Promise.all(clubIds.map((id) => getClubById(id))),
        getStudentClearanceRequests(profile.id),
        getSystemSettings(),
      ]);

      const validClubs = clubsData.filter((c): c is Club => c !== null);
      setClubs(validClubs);
      setSystemSettings(sys);

      const active = requests.find(
        (r) =>
          (r.status === "pending" || r.status === "in_progress" || r.status === "completed") &&
          r.academic_year === sys?.academic_year &&
          r.semester === sys?.current_semester
      ) ?? null;
      setActiveRequest(active);

      // Fetch requirements count and clearance items for each club
      const counts: Record<string, number> = {};
      const items: ClearanceItem[] = [];

      await Promise.all(
        validClubs.map(async (club) => {
          const reqs = await getPublishedRequirementsBySource("club", club.id, profile.year_level);

          counts[club.id] = reqs.length;

          if (active) {
            // Use getOrCreateClearanceItem to ensure clubs have clearance items
            const item = await getOrCreateClearanceItem(active.id, "club", club.id);
            if (item) items.push(item);
          }
        })
      );

      setRequirementCounts(counts);
      setClearanceItems(items);
    } catch (err) {
      // Better error logging for debugging
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Error loading club clearance:", errorMessage, err);
      showToast("error", "Load failed", "Failed to load clearance status.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, profile?.enrolled_clubs, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.enrolled_clubs) {
      setIsLoading(false);
      return;
    }
    loadData();
  }, [authLoading, loadData, profile?.enrolled_clubs]);

  useRealtimeRefresh("clearance_items", loadData);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Clubs Clearance" subtitle="Your club clearance status" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Clubs Clearance" subtitle="Your club clearance status" />
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
        <Header title="Clubs Clearance" subtitle="Your club clearance status" />
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
        title="Clubs Clearance"
        subtitle={`${clubs.length} club${clubs.length !== 1 ? "s" : ""} enrolled`}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClearanceStatusView
          sourceType="club"
          sources={sources}
          requirementCounts={requirementCounts}
          clearanceRequest={activeRequest}
          clearanceItems={clearanceItems}
          loading={false}
          submitHref="/student/clubs/submit"
        />
      </div>
    </div>
  );
}
