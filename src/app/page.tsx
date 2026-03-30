"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AuthModal } from "@/components/features/auth-modal";
import { AnnouncementDetailModal } from "@/components/features/AnnouncementDetailModal";
import { useAuth } from "@/contexts/auth-context";
import { supabase, AnnouncementWithRelations } from "@/lib/supabase";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { AnnouncementsSection } from "@/components/landing/AnnouncementsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { VideoSection } from "@/components/landing/VideoSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { DeveloperStickers } from "@/components/landing/DeveloperStickers";

const CampusMapSection = dynamic(
  () => import("@/components/landing/CampusMapSection").then((mod) => ({ default: mod.CampusMapSection })),
  { ssr: false }
);

interface ClearanceSource {
  name: string;
  type: "department" | "office" | "club" | "csg" | "cspsg" | "csg_department_lgu" | "cspsg_division";
  logo_url: string | null;
}

interface SystemSettings {
  academic_year: string | null;
  current_semester: string | null;
  semester_deadline: string | null;
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, profile, isLoading } = useAuth();
  const [authModal, setAuthModal] = useState<"login" | null>(null);

  // State for dynamic stats from database
  const [stats, setStats] = useState({
    departments: 0,
    offices: 0,
    clubs: 0,
    requirements: 0,
    events: 0,
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [clearanceSources, setClearanceSources] = useState<ClearanceSource[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementWithRelations[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementWithRelations | null>(null);
  // Auto-redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && profile) {
      const rolePathMap: Record<string, string> = { csg_department_lgu: 'csg-department-lgu', cspsg_division: 'cspsg-division' };
      router.push(`/${rolePathMap[profile.role] ?? profile.role}`);
    }
  }, [isLoading, isAuthenticated, profile, router]);

  // Fetch stats and clearance sources from database
  useEffect(() => {
    async function fetchStats() {
      try {
        const [deptResult, officeResult, clubResult, reqResult, eventResult] = await Promise.all([
          supabase.from("departments").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("offices").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("clubs").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("requirements").select("id", { count: "exact", head: true }),
          supabase.from("events").select("id", { count: "exact", head: true }),
        ]);

        setStats({
          departments: deptResult.count || 0,
          offices: officeResult.count || 0,
          clubs: clubResult.count || 0,
          requirements: reqResult.count || 0,
          events: eventResult.count || 0,
        });

        const [depts, offices, clubs, lgus, cspsgDivisions, csgRows, cspsgRows] = await Promise.all([
          supabase.from("departments").select("name, logo_url").eq("status", "active").order("name"),
          supabase.from("offices").select("name, logo_url").eq("status", "active").order("name"),
          supabase.from("clubs").select("name, logo_url").eq("status", "active").order("name"),
          supabase.from("csg_department_lgus").select("name, logo_url").eq("status", "active").order("name"),
          supabase.from("cspsg_divisions").select("name, logo_url").eq("status", "active").order("name"),
          supabase.from("csg").select("name, logo_url").eq("status", "active").order("name"),
          supabase.from("cspsg").select("name, logo_url").eq("status", "active").order("name"),
        ]);

        const settingsResult = await supabase
          .from("system_settings")
          .select("academic_year, current_semester, semester_deadline")
          .maybeSingle();
        if (settingsResult.data) setSystemSettings(settingsResult.data);

        const sources: ClearanceSource[] = [
          ...(depts.data || []).map((d) => ({ name: d.name, type: "department" as const, logo_url: d.logo_url })),
          ...(offices.data || []).map((o) => ({ name: o.name, type: "office" as const, logo_url: o.logo_url })),
          ...(clubs.data || []).map((c) => ({ name: c.name, type: "club" as const, logo_url: c.logo_url })),
          ...(lgus.data || []).map((l) => ({ name: l.name, type: "csg_department_lgu" as const, logo_url: l.logo_url })),
          ...(cspsgDivisions.data || []).map((d) => ({ name: d.name, type: "cspsg_division" as const, logo_url: d.logo_url })),
          ...(csgRows.data || []).map((c) => ({ name: c.name, type: "csg" as const, logo_url: c.logo_url })),
          ...(cspsgRows.data || []).map((c) => ({ name: c.name, type: "cspsg" as const, logo_url: c.logo_url })),
        ];
        setClearanceSources(sources);

        const announcementsResult = await supabase
          .from("announcements")
          .select("*")
          .eq("is_system_wide", true)
          .eq("is_active", true)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .order("priority", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(3);

        if (announcementsResult.data) {
          const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
          const sorted = announcementsResult.data.sort((a, b) => {
            const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (pDiff !== 0) return pDiff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          setAnnouncements(sorted as AnnouncementWithRelations[]);
        }
      } catch (error) {
        console.error("Error fetching landing page stats:", error);
      }
    }
    fetchStats();
  }, []);

  const openAuthModal = () => setAuthModal("login");

  return (
    <>
      <div className="min-h-screen bg-background">
        <LandingHeader onSignIn={openAuthModal} />
        <HeroSection stats={stats} systemSettings={systemSettings} onSignIn={openAuthModal} />
        <FeaturesSection clearanceSources={clearanceSources} />
        <AnnouncementsSection
          announcements={announcements}
          onSelectAnnouncement={setSelectedAnnouncement}
          onSignIn={openAuthModal}
        />
        <HowItWorksSection />
        <VideoSection />
        <CampusMapSection />
        <CTASection onSignIn={openAuthModal} />
        <DeveloperStickers />
        {/* Development disclaimer */}
        <div className="bg-surface-warm border-t border-border-warm px-6 py-4 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            This system is developed as a student project under Software Engineering and is currently under development, with the possibility of being adopted for official use. All content, media, and features shown are subject to change.
          </p>
          <p className="text-xs text-muted-foreground">
            All trademarks, logos, and media belong to their respective owners.
          </p>
        </div>
        <LandingFooter />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal !== null}
        onClose={() => setAuthModal(null)}
        initialMode={authModal || "login"}
      />

      {/* Announcement Detail Modal */}
      <AnnouncementDetailModal
        isOpen={selectedAnnouncement !== null}
        onClose={() => setSelectedAnnouncement(null)}
        announcement={selectedAnnouncement}
      />
    </>
  );
}
