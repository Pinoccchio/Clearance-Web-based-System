"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  stats: { departments: number; offices: number; clubs: number };
  onSignIn: () => void;
}

export function HeroSection({ stats, onSignIn }: HeroSectionProps) {
  const total = stats.departments + stats.offices + stats.clubs;

  return (
    <section className="relative h-[85vh] min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Full-bleed background image */}
      <Image
        src="/images/landing_page/landing_page_pic_1.jpg"
        alt="Cor Jesu College campus"
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      {/* Content — anchored to bottom */}
      <div className="absolute inset-0 flex flex-col justify-end">
        <div className="max-w-6xl mx-auto px-6 pb-16 lg:pb-20 w-full">
          {/* Institutional label */}
          <p className="text-sm sm:text-base text-white/60 uppercase tracking-widest mb-4 fade-in-up">
            Cor Jesu College &mdash; Digos City
          </p>

          {/* Headline */}
          <div className="mb-6 fade-in-up fade-in-up-delay-1">
            <h1 className="font-display font-bold text-white">
              <span className="block text-4xl sm:text-5xl lg:text-6xl leading-tight">
                Student Clearance
              </span>
              <span className="block text-4xl sm:text-5xl lg:text-6xl leading-tight">
                System
              </span>
            </h1>
          </div>

          <p className="text-base lg:text-lg text-white/80 mb-8 max-w-2xl font-body leading-relaxed fade-in-up fade-in-up-delay-2">
            Track your clearance across {total} departments, offices, and organizations.
            Check your status, upload documents, and see what you still need to settle — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 fade-in-up fade-in-up-delay-3">
            <button
              onClick={onSignIn}
              className="btn btn-cjc-red text-base px-8 py-3.5"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
