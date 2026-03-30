"use client";

import Image from "next/image";
import { ArrowRight, Calendar } from "lucide-react";
import { InstallPwaButton } from "./InstallPwaButton";

interface SystemSettings {
  academic_year: string | null;
  current_semester: string | null;
  semester_deadline: string | null;
}

interface HeroSectionProps {
  stats: { departments: number; offices: number; clubs: number; requirements: number; events: number };
  systemSettings: SystemSettings | null;
  onSignIn: () => void;
}

function formatDeadline(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function HeroSection({ stats, systemSettings, onSignIn }: HeroSectionProps) {
  const total = stats.departments + stats.offices + stats.clubs;

  const semesterLabel = systemSettings?.current_semester ?? null;

  const deadlineLabel = formatDeadline(systemSettings?.semester_deadline ?? null);

  return (
    <section className="relative h-[85vh] min-h-[680px] max-h-[1000px] overflow-hidden">
      {/* Full-bleed background image */}
      <Image
        src="/images/landing_page/landing_page_pic_1.jpg"
        alt="Cor Jesu College campus"
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      {/* Content — anchored to bottom */}
      <div className="absolute inset-0 flex flex-col justify-end">
        <div className="max-w-6xl mx-auto px-6 pb-16 lg:pb-20 w-full">
          {/* Institutional label */}
          <p className="text-sm sm:text-base text-white/60 uppercase tracking-widest mb-3 fade-in-up">
            Cor Jesu College &mdash; Digos City
          </p>

          {/* Semester banner — above headline */}
          {(systemSettings?.academic_year || semesterLabel || deadlineLabel) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 fade-in-up">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                {[systemSettings?.academic_year && `AY ${systemSettings.academic_year}`, semesterLabel].filter(Boolean).join(" · ")}
              </span>
              {deadlineLabel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cjc-red/70 backdrop-blur-sm text-white text-xs font-medium">
                  Deadline: {deadlineLabel}
                </span>
              )}
            </div>
          )}

          {/* Headline */}
          <div className="mb-4 fade-in-up fade-in-up-delay-1">
            <h1 className="font-display font-bold text-white">
              <span className="block text-4xl sm:text-5xl lg:text-6xl leading-tight">
                Student Clearance
              </span>
              <span className="block text-4xl sm:text-5xl lg:text-6xl leading-tight">
                System
              </span>
            </h1>
          </div>

          <p className="text-base lg:text-lg text-white/80 mb-5 max-w-2xl font-body leading-relaxed fade-in-up fade-in-up-delay-2">
            Track your clearance across {total} departments, offices, and organizations.
            Check your status, upload documents, and see what you still need to settle — all in one place.
          </p>

          {/* Mini stats row */}
          {(stats.requirements > 0 || stats.events > 0) && (
            <div className="flex flex-wrap gap-3 mb-5 fade-in-up fade-in-up-delay-2">
              {stats.requirements > 0 && (
                <span className="text-white/60 text-xs sm:text-sm">
                  <span className="text-white font-semibold">{stats.requirements}</span> requirements tracked
                </span>
              )}
              {stats.requirements > 0 && stats.events > 0 && (
                <span className="text-white/30 text-xs sm:text-sm">·</span>
              )}
              {stats.events > 0 && (
                <span className="text-white/60 text-xs sm:text-sm">
                  <span className="text-white font-semibold">{stats.events}</span> events recorded
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 fade-in-up fade-in-up-delay-3">
            <button
              onClick={onSignIn}
              className="btn btn-cjc-red text-base px-8 py-3.5"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
            <InstallPwaButton variant="hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
