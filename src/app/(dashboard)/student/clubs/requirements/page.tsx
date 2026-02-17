"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { AlertCircle, Loader2, Users } from "lucide-react";
import RequirementsView from "@/components/student/RequirementsView";
import {
  Club,
  Requirement,
  getAllClubs,
  getRequirementsByMultipleSources,
} from "@/lib/supabase";

export default function ClubsRequirementsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [enrolledClubs, setEnrolledClubs] = useState<Club[]>([]);
  const [requirementsBySource, setRequirementsBySource] = useState<Record<string, Requirement[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) { setIsLoading(false); return; }

    let cancelled = false;

    async function load() {
      try {
        const enrolledIds = profile!.enrolled_clubs
          ? profile!.enrolled_clubs.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];

        const allClubs = await getAllClubs();
        if (cancelled) return;

        const clubs = allClubs.filter((c) => enrolledIds.includes(c.id));
        setEnrolledClubs(clubs);

        if (clubs.length > 0) {
          const reqMap = await getRequirementsByMultipleSources(
            clubs.map((c) => ({ source_type: "club", source_id: c.id }))
          );
          const byId: Record<string, Requirement[]> = {};
          for (const [k, v] of Object.entries(reqMap)) {
            byId[k.split(":")[1]] = v;
          }
          if (!cancelled) setRequirementsBySource(byId);
        }
      } catch (err) {
        if (!cancelled) showToast("error", "Load failed", "Failed to load club requirements.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [authLoading, profile?.id, profile?.enrolled_clubs]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Clubs Requirements" subtitle="Requirements per club" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Clubs Requirements" subtitle="Requirements per club" />
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
        <Header title="Clubs Requirements" subtitle="Requirements per club" />
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
      <Header title="Clubs Requirements" subtitle="Requirements per club" />
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
