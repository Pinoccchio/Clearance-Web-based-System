"use client";

import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { AnnouncementWithRelations } from "@/lib/supabase";

interface AnnouncementsSectionProps {
  announcements: AnnouncementWithRelations[];
  onSelectAnnouncement: (announcement: AnnouncementWithRelations) => void;
  onSignIn: () => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const priorityLabel: Record<string, string> = {
  urgent: "Urgent",
  high: "Important",
  normal: "New",
  low: "Notice",
};

const priorityColor: Record<string, string> = {
  urgent: "text-red-600",
  high: "text-amber-600",
  normal: "text-cjc-red",
  low: "text-muted-foreground",
};

export function AnnouncementsSection({ announcements, onSelectAnnouncement, onSignIn }: AnnouncementsSectionProps) {
  if (announcements.length === 0) return null;

  const featured = announcements[0];
  const secondary = announcements.slice(1);

  return (
    <section className="py-20 lg:py-28 bg-muted/40">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header — centered like UPLB */}
        <div className="text-center mb-12 fade-in-up">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            News and Updates
          </h2>
          <div className="w-16 h-0.5 bg-cjc-red mx-auto mt-4" />
        </div>

        {/* Grid: featured left, secondary stacked right */}
        <div className="grid lg:grid-cols-5 gap-6 fade-in-up fade-in-up-delay-1">
          {/* Featured — large card */}
          <button
            onClick={() => onSelectAnnouncement(featured)}
            className="lg:col-span-3 bg-card rounded-lg border border-border overflow-hidden text-left cursor-pointer group hover:shadow-md transition-shadow"
          >
            <div className="p-8">
              {/* Priority + Date */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${priorityColor[featured.priority] || priorityColor.normal}`}>
                  {priorityLabel[featured.priority] || "New"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(featured.created_at)}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-xl sm:text-2xl text-foreground mb-4 group-hover:text-cjc-red transition-colors line-clamp-3">
                {featured.title}
              </h3>

              {/* Content */}
              <p className="text-muted-foreground leading-relaxed line-clamp-4 mb-6">
                {featured.content}
              </p>

              {/* Event Details */}
              {(featured.event_date || featured.event_location) && (
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                  {featured.event_date && (
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Calendar className="w-4 h-4 text-cjc-red" />
                      {formatDate(featured.event_date)}
                    </span>
                  )}
                  {featured.event_location && (
                    <span className="flex items-center gap-1.5 text-foreground">
                      <MapPin className="w-4 h-4 text-cjc-red" />
                      {featured.event_location}
                    </span>
                  )}
                </div>
              )}

              {/* Read more */}
              <span className="text-sm font-semibold text-cjc-red flex items-center gap-2 group-hover:gap-3 transition-all">
                Read more
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </button>

          {/* Secondary — stacked on right */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {secondary.map((announcement) => (
              <button
                key={announcement.id}
                onClick={() => onSelectAnnouncement(announcement)}
                className="bg-card rounded-lg border border-border p-5 text-left cursor-pointer group hover:shadow-md transition-shadow"
              >
                {/* Priority + Date */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${priorityColor[announcement.priority] || priorityColor.normal}`}>
                    {priorityLabel[announcement.priority] || "New"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(announcement.created_at)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display font-bold text-base text-foreground mb-2 line-clamp-2 group-hover:text-cjc-red transition-colors">
                  {announcement.title}
                </h3>

                {/* Content */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                  {announcement.content}
                </p>

                {/* Event Details */}
                {(announcement.event_date || announcement.event_location) && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {announcement.event_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cjc-red" />
                        {formatShortDate(announcement.event_date)}
                      </span>
                    )}
                    {announcement.event_location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cjc-red" />
                        {announcement.event_location}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center fade-in-up fade-in-up-delay-2">
          <button
            onClick={onSignIn}
            className="inline-flex items-center gap-2 bg-cjc-red-dark text-white text-sm font-semibold px-6 py-3 rounded hover:bg-cjc-red transition-colors"
          >
            Read more
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
