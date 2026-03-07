"use client";

import Image from "next/image";
import { CheckCircle2, ArrowRight, Shield } from "lucide-react";

interface ClearanceSource {
  name: string;
  type: "department" | "office" | "club";
  logo_url: string | null;
}

interface HeroSectionProps {
  stats: { departments: number; offices: number; clubs: number };
  clearanceSources: ClearanceSource[];
  onSignIn: () => void;
}

export function HeroSection({ stats, clearanceSources, onSignIn }: HeroSectionProps) {
  return (
    <section className="relative bg-card overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="hero-pattern absolute inset-0" />

      <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-5 gap-16 items-center">
          {/* Text Content - 60% */}
          <div className="lg:col-span-3 text-center lg:text-left fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-surface-cream border border-border-warm text-sm text-muted-foreground mb-8">
              <span className="w-2 h-2 rounded-full bg-cjc-red"></span>
              Academic Year 2025-2026
            </div>

            {/* Editorial Headline */}
            <div className="mb-8">
              <h1 className="headline-editorial text-cjc-red-dark">
                <span className="block text-5xl sm:text-6xl lg:text-7xl">
                  YOUR
                </span>
                <span className="block text-5xl sm:text-6xl lg:text-7xl pb-3">
                  <span className="headline-underline">CLEARANCE.</span>
                </span>
                <span className="block text-5xl sm:text-6xl lg:text-7xl text-cjc-red">
                  SIMPLIFIED.
                </span>
              </h1>
            </div>

            <p className="text-lg lg:text-xl text-muted-foreground mb-12 max-w-lg mx-auto lg:mx-0 font-body leading-relaxed fade-in-up fade-in-up-delay-4">
              Check your clearance status from anywhere. See which departments have approved you and what requirements you still need to settle at each office.
            </p>

            <div className="flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-4 mb-12">
              <button
                onClick={onSignIn}
                className="btn btn-cjc-red text-base px-8 py-3.5"
              >
                Access Portal
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 lg:gap-10 pt-8 border-t border-border-warm">
              {[
                { value: stats.departments, label: "Departments" },
                { value: stats.offices, label: "Offices" },
                { value: stats.clubs, label: "Clubs" },
              ].map((stat, i) => (
                <div key={stat.label} className={`text-center lg:text-left fade-in-up fade-in-up-delay-${i + 5}`}>
                  <p className="text-3xl sm:text-4xl font-bold text-cjc-red font-display">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Mockup - 40% */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="relative">
              {/* Floating decorative elements */}
              <div className="absolute -top-4 -left-8 z-10 bg-card rounded-lg shadow-lg px-3 py-2 animate-float">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-foreground">Cleared!</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 z-10 bg-card rounded-lg shadow-lg px-3 py-2 animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cjc-red" />
                  <span className="text-xs font-medium text-foreground">Secure</span>
                </div>
              </div>

              {/* Dashboard Preview Card */}
              <div className="relative bg-card rounded-2xl shadow-xl border border-border-warm p-6 fade-in-up fade-in-up-delay-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cjc-red-dark to-cjc-red flex items-center justify-center">
                    <span className="text-white font-bold text-sm">JD</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Juan Dela Cruz</p>
                    <p className="text-xs text-muted-foreground">BSCS - 4th Year</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {clearanceSources.length > 0 ? (
                    clearanceSources.slice(0, 5).map((source, i) => {
                      const isCleared = i < Math.ceil(clearanceSources.slice(0, 5).length * 0.6);
                      return (
                        <div
                          key={`preview-${source.type}-${source.name}`}
                          className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface-warm hover:bg-surface-cream transition-colors duration-200"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {source.logo_url ? (
                              <Image
                                src={source.logo_url}
                                alt={`${source.name} logo`}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cjc-red-dark/20 to-cjc-red/20 flex-shrink-0" />
                            )}
                            <span className="text-sm text-foreground truncate font-medium">{source.name}</span>
                          </div>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ml-2 ${
                              isCleared
                                ? "bg-green-600 text-white"
                                : "bg-cjc-red text-white"
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
                    <span className="text-sm text-muted-foreground">Overall Progress</span>
                    <span className="text-sm font-semibold text-cjc-red">
                      {clearanceSources.length > 0
                        ? `${Math.round((Math.ceil(Math.min(clearanceSources.length, 5) * 0.6) / Math.min(clearanceSources.length, 5)) * 100)}%`
                        : "60%"}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill bg-cjc-red"
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
  );
}
