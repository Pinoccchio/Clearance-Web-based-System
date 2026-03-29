"use client";

import Image from "next/image";
import { CheckCircle2, Users, FileCheck } from "lucide-react";

interface ClearanceSource {
  name: string;
  type: "department" | "office" | "club";
  logo_url: string | null;
}

interface FeaturesSectionProps {
  clearanceSources: ClearanceSource[];
}

export function FeaturesSection({ clearanceSources }: FeaturesSectionProps) {
  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16 text-center lg:text-left fade-in-up">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            What You Get
          </h2>
        </div>

        {/* Featured Block - Full Width CJC Red */}
        <div className="bg-cjc-red-dark text-white rounded-lg p-5 sm:p-8 lg:p-12 mb-6 fade-in-up fade-in-up-delay-1">
          <div className="mb-8">
            <h3 className="text-2xl lg:text-3xl font-display font-bold mb-4">
              All your clearance sources
            </h3>
            <p className="text-white/70 text-lg leading-relaxed max-w-2xl">
              See your status across every department, office, and club. Check what you still need to settle before heading to each one.
            </p>
          </div>

          {/* Clearance sources grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {clearanceSources.length > 0 ? (
              clearanceSources.map((source) => (
                <div
                  key={`${source.type}-${source.name}`}
                  className="flex items-center gap-2 sm:gap-3 py-3 px-3 sm:px-4 rounded-lg bg-white/15 hover:bg-white/25 transition-colors duration-200"
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
                  className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/15 animate-pulse"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20" />
                  <div className="h-4 w-20 bg-white/20 rounded" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Two-Column Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Role-Based Access */}
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-200 text-center md:text-left fade-in-up fade-in-up-delay-2">
            <div className="w-12 h-12 rounded-lg bg-cjc-red-dark flex items-center justify-center mb-5 mx-auto md:mx-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              Dashboards for Every Role
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Students, department staff, organization officers, deans, and admins each get their own dashboard designed for their needs.
            </p>
          </div>

          {/* Digital Documents */}
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-200 text-center md:text-left fade-in-up fade-in-up-delay-3">
            <div className="w-12 h-12 rounded-lg bg-cjc-red flex items-center justify-center mb-5 mx-auto md:mx-0">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              Document Uploads
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Upload required documents online. Your files are saved securely so you won&apos;t lose them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
