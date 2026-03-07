"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mail,
  Phone,
  Clock,
  ExternalLink,
  Map as MapIcon,
  Eye,
  Satellite,
  Mountain,
  Moon,
  Heart,
} from "lucide-react";
import Image from "next/image";
import { GoogleMapView, type ViewMode } from "./GoogleMapView";

const VIEW_MODES: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
  { key: "map", label: "Map", icon: <MapIcon className="w-3.5 h-3.5" /> },
  { key: "satellite", label: "Satellite", icon: <Satellite className="w-3.5 h-3.5" /> },
  { key: "terrain", label: "Terrain", icon: <Mountain className="w-3.5 h-3.5" /> },
  { key: "street", label: "Street View", icon: <Eye className="w-3.5 h-3.5" /> },
  { key: "dark", label: "Dark", icon: <Moon className="w-3.5 h-3.5" /> },
  { key: "humanitarian", label: "Humanitarian", icon: <Heart className="w-3.5 h-3.5" /> },
];

export function CampusMapSection() {
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [mounted, setMounted] = useState(false);

  // Sliding toggle indicator state
  const [indicatorStyle, setIndicatorStyle] = useState<{ width: number; left: number }>({
    width: 0,
    left: 0,
  });
  const toggleGroupRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<ViewMode, HTMLButtonElement>>(new Map());

  const setButtonRef = useCallback((key: ViewMode) => (el: HTMLButtonElement | null) => {
    if (el) {
      buttonRefs.current.set(key, el);
    } else {
      buttonRefs.current.delete(key);
    }
  }, []);

  // Calculate indicator position based on active button
  useEffect(() => {
    const activeBtn = buttonRefs.current.get(viewMode);
    const group = toggleGroupRef.current;
    if (activeBtn && group) {
      const groupRect = group.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        width: btnRect.width,
        left: btnRect.left - groupRect.left,
      });
    }
  }, [viewMode]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      const activeBtn = buttonRefs.current.get(viewMode);
      const group = toggleGroupRef.current;
      if (activeBtn && group) {
        const groupRect = group.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        setIndicatorStyle({
          width: btnRect.width,
          left: btnRect.left - groupRect.left,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  // Lazy mount: render map after component mounts (CSS animation handles reveal)
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="map-section-bg relative overflow-hidden py-24 lg:py-32">
      <div className="relative max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-12 text-center lg:text-left fade-in-up">
          <p className="text-sm font-semibold text-cjc-red uppercase tracking-wider mb-3">
            Find Us
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Visit Our Campus
          </h2>
        </div>

        {/* Two-column grid */}
        <div className="map-section-grid">
          {/* Left Column - Info Card */}
          <div className="map-info-card fade-in-up fade-in-up-delay-1">
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
            <div className="h-px bg-border-warm mb-6" />

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
              <ExternalLink className="w-4 h-4 arrow-slide-right" />
            </a>
          </div>

          {/* Right Column - Map */}
          <div className="fade-in-up fade-in-up-delay-2">
            {/* Toggle Bar with Sliding Indicator */}
            <div className="map-toggle-group mb-4" ref={toggleGroupRef}>
              {/* Sliding indicator */}
              <div
                className="map-toggle-indicator"
                style={{
                  width: indicatorStyle.width,
                  transform: `translateX(${indicatorStyle.left}px)`,
                }}
                aria-hidden="true"
              />
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.key}
                  ref={setButtonRef(mode.key)}
                  onClick={() => setViewMode(mode.key)}
                  className={`map-toggle-btn ${viewMode === mode.key ? "map-toggle-active" : ""}`}
                >
                  {mode.icon}
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              ))}
            </div>

            {/* Map Container */}
            <div className="map-wrapper relative">
              {mounted ? (
                <GoogleMapView viewMode={viewMode} />
              ) : (
                <div className="map-container map-placeholder-premium">
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <MapIcon className="w-10 h-10 text-cjc-gold map-placeholder-icon" />
                    <p className="text-sm text-muted-foreground">Loading interactive map...</p>
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
