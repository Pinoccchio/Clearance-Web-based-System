"use client";

import { useState, useEffect, useRef, RefObject, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2,
  ArrowRight,
  Facebook,
  Music2,
  Calendar,
  MapPin,
  Shield,
  FileCheck,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import { AuthModal } from "@/components/features/auth-modal";
import { AnnouncementDetailModal } from "@/components/features/AnnouncementDetailModal";
import { useAuth } from "@/contexts/auth-context";
import { supabase, AnnouncementWithRelations } from "@/lib/supabase";

const CampusMapSection = dynamic(
  () => import("@/components/landing/CampusMapSection").then((mod) => ({ default: mod.CampusMapSection })),
  { ssr: false }
);

// Hook to detect when element enters viewport
function useInView(ref: RefObject<HTMLElement | null>, threshold = 0.1) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold }
    );

    const observeElement = () => {
      if (ref.current) {
        observer.observe(ref.current);
        return true;
      }
      return false;
    };

    if (!observeElement()) {
      const checkInterval = setInterval(() => {
        if (observeElement()) {
          clearInterval(checkInterval);
        }
      }, 100);

      return () => {
        clearInterval(checkInterval);
        observer.disconnect();
      };
    }

    return () => observer.disconnect();
  }, [ref, threshold]);

  return inView;
}

// Enhanced animated counter with overshoot easing
function AnimatedCounter({ value, inView, className = "" }: { value: number; inView: boolean; className?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!inView || hasAnimated) return;
    setHasAnimated(true);

    let startTime: number | null = null;
    const duration = 1500;

    const easeOutBack = (x: number): number => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutBack(progress);
      setCount(Math.floor(Math.min(easedProgress * value, value)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value, hasAnimated]);

  return <span className={className}>{count}</span>;
}

// Type for clearance sources
interface ClearanceSource {
  name: string;
  type: "department" | "office" | "club";
  logo_url: string | null;
}


export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, profile, isLoading } = useAuth();
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);

  // Scroll state for navigation
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // State for dynamic stats from database
  const [stats, setStats] = useState({
    departments: 0,
    offices: 0,
    clubs: 0,
  });
  const [clearanceSources, setClearanceSources] = useState<ClearanceSource[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementWithRelations[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementWithRelations | null>(null);

  // Handle scroll for parallax and navigation effects
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setScrollY(currentScrollY);

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const progress = (currentScrollY / (documentHeight - windowHeight)) * 100;
    setScrollProgress(Math.min(progress, 100));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Auto-redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && profile) {
      router.push(`/${profile.role}`);
    }
  }, [isLoading, isAuthenticated, profile, router]);

  // Fetch stats and clearance sources from database
  useEffect(() => {
    async function fetchStats() {
      try {
        const [deptResult, officeResult, clubResult] = await Promise.all([
          supabase.from("departments").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("offices").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("clubs").select("id", { count: "exact", head: true }).eq("status", "active"),
        ]);

        setStats({
          departments: deptResult.count || 0,
          offices: officeResult.count || 0,
          clubs: clubResult.count || 0,
        });

        const [depts, offices, clubs] = await Promise.all([
          supabase.from("departments").select("name, logo_url").eq("status", "active").order("name"),
          supabase.from("offices").select("name, logo_url").eq("status", "active").order("name"),
          supabase.from("clubs").select("name, logo_url").eq("status", "active").order("name"),
        ]);

        const sources: ClearanceSource[] = [
          ...(depts.data || []).map((d) => ({ name: d.name, type: "department" as const, logo_url: d.logo_url })),
          ...(offices.data || []).map((o) => ({ name: o.name, type: "office" as const, logo_url: o.logo_url })),
          ...(clubs.data || []).map((c) => ({ name: c.name, type: "club" as const, logo_url: c.logo_url })),
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

  // Refs for scroll animations
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const navyBlockRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLElement>(null);
  const announcementsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  // In-view states
  const heroInView = useInView(heroRef, 0.1);
  const statsInView = useInView(statsRef, 0.3);
  const featuresInView = useInView(featuresRef, 0.1);
  const navyBlockInView = useInView(navyBlockRef, 0.2);
  const cardsInView = useInView(cardsRef, 0.2);
  const timelineInView = useInView(timelineRef, 0.1);
  const announcementsInView = useInView(announcementsRef, 0.1);
  const ctaInView = useInView(ctaRef, 0.2);

  // Helper functions for announcements
  const formatAnnouncementDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatAnnouncementDate(dateString);
  };

  const isScrolled = scrollY > 50;

  return (
    <>
      <div className="min-h-screen bg-[#fefcf8]">
        {/* Premium Navigation with Glass Effect */}
        <header
          className={`nav-sticky border-b transition-all duration-300 ${
            isScrolled
              ? 'nav-sticky scrolled border-border-warm/50'
              : 'bg-white border-border-warm'
          }`}
        >
          <nav className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo with scale animation */}
              <div className={`flex items-center gap-3 transition-transform duration-300 ${isScrolled ? 'scale-95' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border-warm shadow-sm">
                    <Image
                      src="/images/logos/cjc-logo.jpeg"
                      alt="CJC Logo"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border-warm shadow-sm">
                    <Image
                      src="/images/logos/ccis-logo.jpg"
                      alt="CCIS Logo"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-cjc-navy text-sm tracking-wide uppercase">
                    Cor Jesu College
                  </p>
                  <p className="text-xs text-warm-muted">
                    <span className="ccis-braces">{"{"}</span> College of Computing and Information Sciences <span className="ccis-braces">{"}"}</span>
                  </p>
                </div>
              </div>

              {/* Nav Actions with animated underlines */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAuthModal("login")}
                  className="nav-link-animated text-sm font-medium text-cjc-navy/70 hover:text-cjc-navy transition-colors px-3 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthModal("register")}
                  className="btn btn-ccis-blue btn-glow btn-magnetic text-sm"
                >
                  Get Started
                </button>
              </div>
            </div>
          </nav>

          {/* CCIS Blue Accent Bar with Scroll Progress */}
          <div className="relative h-1 bg-ccis-blue-primary/20">
            <div
              className="scroll-progress"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </header>

        {/* Hero Section - Cinematic Editorial Design */}
        <section ref={heroRef} className="relative bg-white overflow-hidden">
          {/* Subtle dot pattern */}
          <div className="hero-pattern absolute inset-0" />

          <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
            <div className="grid lg:grid-cols-5 gap-16 items-center">
              {/* Text Content - 60% */}
              <div className={`lg:col-span-3 text-center lg:text-left animate-fade-up ${heroInView ? 'in-view' : ''}`}>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-surface-cream border border-border-warm text-sm text-warm-muted mb-8">
                  <span className="w-2 h-2 rounded-full bg-ccis-blue-primary"></span>
                  Academic Year 2025-2026
                </div>

                {/* Editorial Headline */}
                <div className="mb-8">
                  <h1 className="headline-editorial text-cjc-navy">
                    <span className="block text-5xl sm:text-6xl lg:text-7xl">
                      YOUR
                    </span>
                    <span className="block text-5xl sm:text-6xl lg:text-7xl pb-3">
                      <span className="headline-underline">CLEARANCE.</span>
                    </span>
                    <span className="block text-5xl sm:text-6xl lg:text-7xl text-ccis-blue-primary">
                      SIMPLIFIED.
                    </span>
                  </h1>
                </div>

                <p className="text-lg lg:text-xl text-warm-muted mb-12 max-w-lg mx-auto lg:mx-0 font-body leading-relaxed opacity-0 animate-fade-up in-view" style={{ animationDelay: '0.4s' }}>
                  Check your clearance status from anywhere. See which departments have approved you and what requirements you still need to settle at each office.
                </p>

                <div className="flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-4 mb-12">
                  <button
                    onClick={() => setAuthModal("login")}
                    className="btn btn-ccis-blue text-base px-8 py-3.5"
                  >
                    Access Portal
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAuthModal("register")}
                    className="btn btn-secondary text-base px-8 py-3.5"
                  >
                    Create Account
                  </button>
                </div>

                {/* Stats Bar */}
                <div
                  ref={statsRef}
                  className="grid grid-cols-4 gap-4 lg:gap-10 pt-8 border-t border-border-warm"
                >
                  {[
                    { value: stats.departments, label: "Departments" },
                    { value: stats.offices, label: "Offices" },
                    { value: stats.clubs, label: "Clubs" },
                    { value: 0, label: "Paper Forms" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center lg:text-left">
                      <p className="text-3xl sm:text-4xl font-bold text-ccis-blue-primary font-display">
                        <AnimatedCounter value={stat.value} inView={statsInView} />
                      </p>
                      <p className="text-xs sm:text-sm text-warm-muted mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Mockup - 40% with 3D Tilt */}
              <div className="lg:col-span-2 hidden lg:block">
                <div className="relative">
                  {/* Floating decorative elements */}
                  <div className="floating-element -top-4 -left-8 animate-float z-10">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-cjc-navy">Cleared!</span>
                    </div>
                  </div>
                  <div className="floating-element -bottom-4 -right-4 animate-float-delay-1 z-10">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-ccis-blue-primary" />
                      <span className="text-xs font-medium text-cjc-navy">Secure</span>
                    </div>
                  </div>

                  {/* Decorative offset shadow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-ccis-blue-primary/10 to-cjc-gold/10 rounded-2xl transform translate-x-4 translate-y-4"></div>

                  {/* Dashboard Preview Card with 3D effect */}
                  <div className="dashboard-mockup relative bg-white rounded-2xl shadow-2xl border border-border-warm p-6 hover:shadow-3xl transition-all duration-500">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cjc-navy to-cjc-navy-light flex items-center justify-center">
                        <span className="text-white font-bold text-sm">JD</span>
                      </div>
                      <div>
                        <p className="font-semibold text-cjc-navy">Juan Dela Cruz</p>
                        <p className="text-xs text-warm-muted">BSCS - 4th Year</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {clearanceSources.length > 0 ? (
                        clearanceSources.slice(0, 5).map((source, i) => {
                          const isCleared = i < Math.ceil(clearanceSources.slice(0, 5).length * 0.6);
                          return (
                            <div
                              key={`preview-${source.type}-${source.name}`}
                              className="source-card flex items-center justify-between py-3 px-4 rounded-xl bg-surface-warm hover:bg-surface-cream transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {source.logo_url ? (
                                  <Image
                                    src={source.logo_url}
                                    alt={`${source.name} logo`}
                                    width={24}
                                    height={24}
                                    className="source-card-logo w-6 h-6 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cjc-navy/20 to-ccis-blue/20 flex-shrink-0" />
                                )}
                                <span className="text-sm text-cjc-navy truncate font-medium">{source.name}</span>
                              </div>
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ml-2 ${
                                  isCleared
                                    ? "bg-green-100 text-green-700"
                                    : "bg-ccis-blue-primary/10 text-ccis-blue-primary"
                                }`}
                              >
                                {isCleared ? "Cleared" : "Pending"}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface-warm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full skeleton-gold" />
                              <div className="h-4 w-24 skeleton-gold rounded" />
                            </div>
                            <div className="h-6 w-16 skeleton-gold rounded-full" />
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border-warm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-warm-muted">Overall Progress</span>
                        <span className="text-sm font-semibold text-ccis-blue-primary">
                          {clearanceSources.length > 0
                            ? `${Math.round((Math.ceil(Math.min(clearanceSources.length, 5) * 0.6) / Math.min(clearanceSources.length, 5)) * 100)}%`
                            : "60%"}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill bg-ccis-blue-primary"
                          style={{
                            width: clearanceSources.length > 0
                              ? `${Math.round((Math.ceil(Math.min(clearanceSources.length, 5) * 0.6) / Math.min(clearanceSources.length, 5)) * 100)}%`
                              : "60%",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Bento Grid with Asymmetry */}
        <section ref={featuresRef} className="py-24 lg:py-32 bg-[#fefcf8]">
          <div className="max-w-6xl mx-auto px-6">
            <div className={`mb-16 text-center lg:text-left animate-fade-up ${featuresInView ? 'in-view' : ''}`}>
              <p className="text-sm font-semibold text-ccis-blue-primary uppercase tracking-wider mb-3">
                Why Use This?
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-cjc-navy">
                Make Clearance Easier
              </h2>
            </div>

            {/* Featured Block - Full Width Navy */}
            <div
              ref={navyBlockRef}
              className={`bg-cjc-navy text-white rounded-lg p-8 lg:p-12 mb-6 animate-fade-up ${navyBlockInView ? 'in-view' : ''}`}
            >
                <div className="mb-8">
                  <h3 className="text-2xl lg:text-3xl font-display font-bold mb-4">
                    One portal. Every clearance source.
                  </h3>
                  <p className="text-white/70 text-lg leading-relaxed max-w-2xl">
                    Check your status across all departments, offices, and clubs in one place. Know exactly what you need to settle before visiting each location.
                  </p>
                </div>

                {/* Clearance sources grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {clearanceSources.length > 0 ? (
                    clearanceSources.map((source) => (
                      <div
                        key={`${source.type}-${source.name}`}
                        className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                      >
                        {source.logo_url ? (
                          <Image
                            src={source.logo_url}
                            alt={`${source.name} logo`}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <CheckCircle2
                            className={`w-5 h-5 flex-shrink-0 ${
                              source.type === "department"
                                ? "text-cjc-gold"
                                : source.type === "office"
                                  ? "text-cjc-crimson-light"
                                  : "text-green-400"
                            }`}
                          />
                        )}
                        <span className="text-sm text-white/90 break-words leading-tight">{source.name}</span>
                      </div>
                    ))
                  ) : (
                    Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/10 animate-pulse"
                      >
                        <div className="w-6 h-6 rounded-full bg-white/20" />
                        <div className="h-4 w-20 bg-white/20 rounded" />
                      </div>
                    ))
                  )}
                </div>
            </div>

            {/* Two-Column Feature Cards */}
            <div ref={cardsRef} className={`grid md:grid-cols-2 gap-6 animate-stagger ${cardsInView ? 'in-view' : ''}`}>
              {/* Role-Based Access */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-border-warm hover:shadow-md transition-shadow text-center md:text-left">
                <div className="w-12 h-12 rounded-lg bg-cjc-navy flex items-center justify-center mb-5 mx-auto md:mx-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-display font-bold text-cjc-navy mb-2">
                  Role-Based Access
                </h3>
                <p className="text-warm-muted text-sm leading-relaxed mb-4">
                  Students, department staff, organization officers, deans, and admins each get their own dashboard designed for their needs.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-warm text-sm text-cjc-navy">
                    <CheckCircle2 className="w-4 h-4 text-ccis-blue" />
                    5 user roles
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-warm text-sm text-cjc-navy">
                    <CheckCircle2 className="w-4 h-4 text-ccis-blue" />
                    Custom views
                  </span>
                </div>
              </div>

              {/* Digital Documents */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-border-warm hover:shadow-md transition-shadow text-center md:text-left">
                <div className="w-12 h-12 rounded-lg bg-ccis-blue-primary flex items-center justify-center mb-5 mx-auto md:mx-0">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-display font-bold text-cjc-navy mb-2">
                  Digital Documents
                </h3>
                <p className="text-warm-muted text-sm leading-relaxed mb-4">
                  Upload required documents online. Your files are saved securely so you won&apos;t lose them.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-warm text-sm text-cjc-navy">
                    <CheckCircle2 className="w-4 h-4 text-ccis-blue" />
                    Secure uploads
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-warm text-sm text-cjc-navy">
                    <CheckCircle2 className="w-4 h-4 text-ccis-blue" />
                    Easy tracking
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Announcements Section - Magazine Editorial Style */}
        {announcements.length > 0 && (
          <section ref={announcementsRef} className="py-24 lg:py-32 bg-white">
            <div className="max-w-6xl mx-auto px-6">
              {/* Section Header */}
              <div className={`mb-12 text-center lg:text-left animate-fade-up ${announcementsInView ? 'in-view' : ''}`}>
                <p className="text-sm font-semibold text-ccis-blue-primary uppercase tracking-wider mb-3">
                  Announcements
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-cjc-navy">
                  Latest Updates
                </h2>
              </div>

              {/* Newspaper Grid Layout */}
              <div className={`announcement-grid ${announcementsInView ? 'in-view' : ''}`}>
                {/* Featured Announcement */}
                {announcements.length > 0 && (
                  <button
                    onClick={() => setSelectedAnnouncement(announcements[0])}
                    className={`announcement-featured group text-left cursor-pointer announcement-reveal ${announcementsInView ? '' : 'opacity-0'}`}
                    style={{ animationDelay: '0.1s' }}
                  >
                    {/* Decorative elements */}
                    <div className="dot-pattern top-4 right-4" />

                    <div className="relative p-8 sm:p-10 h-full flex flex-col">
                      {/* Priority Badge */}
                      <div className="mb-6">
                        <span className={`priority-badge ${
                          announcements[0].priority === 'urgent' ? 'priority-badge-urgent pulse-glow' :
                          announcements[0].priority === 'high' ? 'priority-badge-high' :
                          announcements[0].priority === 'normal' ? 'priority-badge-normal' :
                          'priority-badge-low'
                        }`}>
                          {announcements[0].priority === 'urgent' && (
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          )}
                          {announcements[0].priority === 'urgent' ? 'Breaking' :
                           announcements[0].priority === 'high' ? 'High Priority' :
                           announcements[0].priority === 'normal' ? 'Announcement' : 'Notice'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="announcement-featured-title text-white mb-6 group-hover:text-cjc-gold transition-colors">
                        {announcements[0].title}
                      </h3>

                      {/* Content Preview */}
                      <div className="content-fade-mask flex-1 mb-6">
                        <p className="text-white/70 leading-relaxed line-clamp-4">
                          {announcements[0].content}
                        </p>
                      </div>

                      {/* Event Details */}
                      {(announcements[0].event_date || announcements[0].event_location) && (
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                          {announcements[0].event_date && (
                            <span className="event-pill bg-white/10 border-white/20 text-white">
                              <Calendar className="event-pill-icon" />
                              {formatAnnouncementDate(announcements[0].event_date)}
                            </span>
                          )}
                          {announcements[0].event_location && (
                            <span className="event-pill bg-white/10 border-white/20 text-white">
                              <MapPin className="event-pill-icon" />
                              {announcements[0].event_location}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-6 border-t border-white/10">
                        <span className="text-xs text-white/50 font-medium">
                          {formatRelativeTime(announcements[0].created_at)}
                        </span>
                        <span className="text-sm text-cjc-gold font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                          Read More
                          <ArrowRight className="w-4 h-4 arrow-slide-right" />
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {/* Secondary Announcements */}
                {announcements.slice(1).map((announcement, index) => (
                  <button
                    key={announcement.id}
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className={`announcement-card announcement-card-${announcement.priority} group text-left cursor-pointer announcement-reveal ${announcementsInView ? '' : 'opacity-0'}`}
                    style={{ animationDelay: `${(index + 2) * 0.1}s` }}
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <span className={`priority-badge ${
                          announcement.priority === 'urgent' ? 'priority-badge-urgent' :
                          announcement.priority === 'high' ? 'priority-badge-high' :
                          announcement.priority === 'normal' ? 'priority-badge-normal' :
                          'priority-badge-low'
                        }`}>
                          {announcement.priority === 'urgent' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                          {announcement.priority === 'urgent' ? 'Urgent' :
                           announcement.priority === 'high' ? 'High' :
                           announcement.priority === 'normal' ? 'New' : 'Notice'}
                        </span>
                        <span className="text-xs text-warm-muted font-medium whitespace-nowrap">
                          {formatRelativeTime(announcement.created_at)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="announcement-card-title font-display font-bold text-lg text-cjc-navy mb-3 line-clamp-2 group-hover:text-ccis-blue-primary transition-colors">
                        {announcement.title}
                      </h3>

                      {/* Content Preview */}
                      <p className="text-sm text-warm-muted line-clamp-2 mb-4 leading-relaxed">
                        {announcement.content}
                      </p>

                      {/* Event Details */}
                      {(announcement.event_date || announcement.event_location) && (
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          {announcement.event_date && (
                            <span className="flex items-center gap-1.5 text-cjc-navy font-medium">
                              <Calendar className="w-3.5 h-3.5 text-cjc-gold" />
                              {new Date(announcement.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                          {announcement.event_location && (
                            <span className="flex items-center gap-1.5 text-cjc-navy font-medium">
                              <MapPin className="w-3.5 h-3.5 text-cjc-gold" />
                              {announcement.event_location}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* View All CTA */}
              <div className={`mt-16 text-center animate-fade-up ${announcementsInView ? 'in-view' : ''}`} style={{ transitionDelay: '400ms' }}>
                <button
                  onClick={() => setAuthModal("login")}
                  className="btn btn-ccis-blue btn-glow btn-magnetic text-base px-8 py-4 rounded-lg"
                >
                  Sign in to view all announcements
                  <ArrowRight className="w-5 h-5 arrow-slide-right" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* How It Works - Premium Timeline */}
        <section ref={timelineRef} className="bg-[#fefcf8] py-24 lg:py-32">
          <div className="max-w-4xl mx-auto px-6">
            <div className={`text-center mb-16 animate-fade-up ${timelineInView ? 'in-view' : ''}`}>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-cjc-navy">
                How It Works
              </h2>
            </div>

            {/* Timeline with animated SVG line */}
            <div className="timeline-premium">
              {/* SVG Line */}
              <svg
                className="timeline-svg-line"
                viewBox="0 0 4 400"
                preserveAspectRatio="none"
              >
                <line
                  x1="2"
                  y1="0"
                  x2="2"
                  y2="400"
                  stroke="#e8e4de"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="2"
                  y1="0"
                  x2="2"
                  y2="400"
                  stroke="url(#timelineGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className={timelineInView ? 'timeline-line-animated' : ''}
                  style={{ strokeDasharray: 1000, strokeDashoffset: timelineInView ? 0 : 1000 }}
                />
                <defs>
                  <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1E40AF" />
                    <stop offset="50%" stopColor="#d4a418" />
                    <stop offset="100%" stopColor="#1E40AF" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Timeline Steps */}
              <div className="timeline-vertical">
                {[
                  {
                    step: "01",
                    title: "Create Your Account",
                    desc: "Register using your student ID and school email. Set up your profile and select the organizations you belong to.",
                  },
                  {
                    step: "02",
                    title: "Submit Clearance Request",
                    desc: "Start a clearance request for graduation, semester end, or transfer. The system will show all departments and organizations you need to clear.",
                  },
                  {
                    step: "03",
                    title: "Check Status and Settle Requirements",
                    desc: "See which departments have approved you and which ones need action. Visit offices to settle any pending requirements like unpaid fees or unreturned books.",
                  },
                  {
                    step: "04",
                    title: "Get Your Clearance",
                    desc: "Once all departments and organizations have approved you, download or print your official clearance certificate.",
                  },
                ].map((item, index) => (
                  <div
                    key={item.step}
                    className={`timeline-step timeline-step-animate ${timelineInView ? 'in-view' : ''}`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    <div className="timeline-number">{item.step}</div>
                    <div className="timeline-card-expand bg-white rounded-xl p-6 shadow-sm border border-border-warm">
                      <h3 className="font-display font-bold text-cjc-navy text-xl mb-3">
                        {item.title}
                      </h3>
                      <p className="text-warm-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Campus Map Section */}
        <CampusMapSection />

        {/* CTA Section */}
        <section ref={ctaRef} className="bg-ccis-cta py-20 lg:py-28">
          <div className={`max-w-4xl mx-auto px-6 text-center animate-fade-up ${ctaInView ? 'in-view' : ''}`}>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Start Your Clearance Today
            </h2>

            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              No more guessing which offices you still need to visit. Track your clearance progress and know exactly what to settle.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setAuthModal("register")}
                className="btn bg-white text-ccis-blue-primary hover:bg-gray-100 text-base px-10 py-4 font-semibold"
              >
                Create Your Account
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAuthModal("login")}
                className="btn btn-outline-white text-base px-10 py-4"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#0a1f36] text-white/70">
          <div className="h-1 bg-ccis-blue-primary"></div>
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="grid md:grid-cols-5 gap-10 text-center md:text-left">
              <div className="md:col-span-2">
                <div className="flex flex-col items-center md:items-start gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
                      <Image
                        src="/images/logos/cjc-logo.jpeg"
                        alt="CJC Logo"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
                      <Image
                        src="/images/logos/ccis-logo.jpg"
                        alt="CCIS Logo"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-bold text-xl">Cor Jesu College</p>
                    <p className="text-sm text-white/50">
                      Sacred Heart Avenue, Digos City
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed max-w-md mx-auto md:mx-0 mb-6">
                  A software engineering project developed by Jan Miko A. Guevarra
                  and Jan Carlo Surig, students of the College of Special Programs (CSP)
                  and College of Computing and Information Sciences (CCIS).
                </p>
              </div>

              <div>
                <h4 className="text-white font-bold mb-5 text-lg">Programs</h4>
                <ul className="space-y-3 text-sm">
                  <li className="link-slide-underline hover:text-white transition-colors cursor-default">BS Computer Science</li>
                  <li className="link-slide-underline hover:text-white transition-colors cursor-default">BS Information Technology</li>
                  <li className="link-slide-underline hover:text-white transition-colors cursor-default">BS Library & Info Science</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-5 text-lg">Contact CCIS</h4>
                <ul className="space-y-3 text-sm">
                  <li className="hover:text-white transition-colors">computerstudies@g.cjc.edu.ph</li>
                  <li className="hover:text-white transition-colors">09082191651</li>
                  <li className="hover:text-white transition-colors">Mon - Fri: 8:00 AM - 5:00 PM</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-5 text-lg">Follow CCIS</h4>
                <div className="flex gap-3 justify-center md:justify-start">
                  <a
                    href="https://facebook.com/cjccomputerstudies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-hover"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="https://tiktok.com/@cjc.ccis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-hover"
                    aria-label="TikTok"
                  >
                    <Music2 className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm">
                &copy; {new Date().getFullYear()} Cor Jesu College. All rights reserved.
              </p>
              <p className="text-sm text-white font-semibold">
                College of Computing and Information Sciences
              </p>
            </div>
          </div>
        </footer>
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
