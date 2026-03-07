"use client";

import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { AnnouncementWithRelations } from "@/lib/supabase";

interface AnnouncementsSectionProps {
  announcements: AnnouncementWithRelations[];
  onSelectAnnouncement: (announcement: AnnouncementWithRelations) => void;
  onSignIn: () => void;
}

function formatAnnouncementDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatAnnouncementDate(dateString);
}

export function AnnouncementsSection({ announcements, onSelectAnnouncement, onSignIn }: AnnouncementsSectionProps) {
  if (announcements.length === 0) return null;

  return (
    <section className="py-24 lg:py-32 bg-card">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-12 text-center lg:text-left fade-in-up">
          <p className="text-sm font-semibold text-cjc-red uppercase tracking-wider mb-3">
            Announcements
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Latest Updates
          </h2>
        </div>

        {/* Newspaper Grid Layout */}
        <div className="announcement-grid">
          {/* Featured Announcement */}
          <button
            onClick={() => onSelectAnnouncement(announcements[0])}
            className="announcement-featured group text-left cursor-pointer fade-in-up fade-in-up-delay-1"
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
              <h3 className="announcement-featured-title text-white mb-6 group-hover:text-cjc-gold transition-colors duration-200">
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
                <span className="text-sm text-cjc-gold font-semibold flex items-center gap-2 group-hover:gap-3 transition-all duration-200">
                  Read More
                  <ArrowRight className="w-4 h-4 arrow-slide-right" />
                </span>
              </div>
            </div>
          </button>

          {/* Secondary Announcements */}
          {announcements.slice(1).map((announcement, index) => (
            <button
              key={announcement.id}
              onClick={() => onSelectAnnouncement(announcement)}
              className={`announcement-card announcement-card-${announcement.priority} group text-left cursor-pointer fade-in-up fade-in-up-delay-${index + 2}`}
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
                  <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                    {formatRelativeTime(announcement.created_at)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="announcement-card-title font-display font-bold text-lg text-foreground mb-3 line-clamp-2 group-hover:text-cjc-red transition-colors duration-200">
                  {announcement.title}
                </h3>

                {/* Content Preview */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                  {announcement.content}
                </p>

                {/* Event Details */}
                {(announcement.event_date || announcement.event_location) && (
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {announcement.event_date && (
                      <span className="flex items-center gap-1.5 text-foreground font-medium">
                        <Calendar className="w-3.5 h-3.5 text-cjc-gold" />
                        {new Date(announcement.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    {announcement.event_location && (
                      <span className="flex items-center gap-1.5 text-foreground font-medium">
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
        <div className="mt-16 text-center fade-in-up fade-in-up-delay-4">
          <button
            onClick={onSignIn}
            className="btn btn-cjc-red text-base px-8 py-4 rounded-lg"
          >
            Sign in to view all announcements
            <ArrowRight className="w-5 h-5 arrow-slide-right" />
          </button>
        </div>
      </div>
    </section>
  );
}
