"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Clock,
  ExternalLink,
  Map as MapIcon,
} from "lucide-react";
import Image from "next/image";
import { GoogleMapView, type ViewMode } from "./GoogleMapView";

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "map", label: "Map" },
  { key: "satellite", label: "Satellite" },
  { key: "street", label: "Street View" },
];

export function CampusMapSection() {
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="py-20 lg:py-28 bg-muted/40">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Campus Location
          </h2>
          <div className="w-16 h-0.5 bg-cjc-red mx-auto" />
        </div>

        {/* Two-column grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Info Card */}
          <div className="bg-card rounded-lg border border-border p-6">
            {/* Location Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                <Image
                  src="/images/logos/cjc-logo.jpeg"
                  alt="CJC Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground text-xl mb-1">
                  Cor Jesu College
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Sacred Heart Avenue
                  <br />
                  Digos City, Davao del Sur 8002
                  <br />
                  Philippines
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border mb-6" />

            {/* Contact Info */}
            <div className="space-y-4 mb-8">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Contact Information
              </h4>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cjc-red flex-shrink-0" />
                <a
                  href="mailto:customerservice@cjc.edu.ph"
                  className="text-sm text-muted-foreground hover:text-cjc-red transition-colors duration-200"
                >
                  customerservice@cjc.edu.ph
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-cjc-red flex-shrink-0" />
                <span className="text-sm text-muted-foreground">(082) 553-2433</span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-cjc-red flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Mon - Fri: 8:00 AM - 5:00 PM</span>
              </div>
            </div>

            {/* Get Directions Button */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=6.7513,125.3522&destination_place_id=Cor+Jesu+College+Digos+City`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-cjc-red w-full justify-center text-sm py-3"
            >
              Get Directions
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Right Column - Map */}
          <div>
            {/* View mode tabs — simple Google Maps style */}
            <div className="flex gap-1 mb-2">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    viewMode === mode.key
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Map container */}
            <div className="rounded-lg overflow-hidden border border-border h-[350px] lg:h-[450px]">
              {mounted ? (
                <GoogleMapView viewMode={viewMode} />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted/40">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapIcon className="w-5 h-5" />
                    <p className="text-sm">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
