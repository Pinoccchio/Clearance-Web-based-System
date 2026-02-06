"use client";

import { Modal } from "@/components/ui/modal";
import { AnnouncementWithRelations } from "@/lib/supabase";
import { Calendar, MapPin, Clock, AlertCircle } from "lucide-react";

interface AnnouncementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: AnnouncementWithRelations | null;
}

export function AnnouncementDetailModal({
  isOpen,
  onClose,
  announcement,
}: AnnouncementDetailModalProps) {
  if (!announcement) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const priorityConfig = {
    urgent: {
      bg: "bg-cjc-crimson",
      text: "text-white",
      label: "Urgent",
    },
    high: {
      bg: "bg-cjc-gold",
      text: "text-cjc-navy",
      label: "High Priority",
    },
    normal: {
      bg: "bg-surface-cream",
      text: "text-cjc-navy",
      label: "Normal",
    },
    low: {
      bg: "bg-cjc-navy/10",
      text: "text-cjc-navy",
      label: "Low Priority",
    },
  };

  const priority = priorityConfig[announcement.priority] || priorityConfig.normal;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      {/* Priority Accent Bar - Animated width expansion */}
      <div
        className={`h-1.5 modal-bar-animate ${
          announcement.priority === "urgent"
            ? "bg-cjc-crimson"
            : announcement.priority === "high"
              ? "bg-cjc-gold"
              : "bg-cjc-navy/20"
        }`}
      />

      <div className="p-6 sm:p-8">
        {/* Header - Fade up animation */}
        <div className="flex items-start gap-4 mb-6 modal-fade-up modal-fade-up-delay-1">
          {/* Priority Circle - Scale in animation */}
          <div
            className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center modal-scale-in ${priority.bg}`}
          >
            <AlertCircle className={`w-6 h-6 ${priority.text}`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Priority Badge */}
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${priority.bg} ${priority.text}`}
            >
              {priority.label}
            </span>

            {/* Title */}
            <h2 className="font-display text-xl sm:text-2xl font-bold text-cjc-navy leading-tight">
              {announcement.title}
            </h2>
          </div>
        </div>

        {/* Event Details Card - If Present */}
        {(announcement.event_date || announcement.event_location) && (
          <div className="bg-surface-cream border border-border-warm rounded-lg p-4 mb-6 modal-fade-up modal-fade-up-delay-2">
            <p className="text-xs font-semibold text-ccis-blue-primary uppercase tracking-wider mb-3">
              Event Details
            </p>
            <div className="space-y-2">
              {announcement.event_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-cjc-gold flex-shrink-0" />
                  <span className="text-sm text-cjc-navy font-medium">
                    {formatDateTime(announcement.event_date)}
                  </span>
                </div>
              )}
              {announcement.event_location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-cjc-gold flex-shrink-0" />
                  <span className="text-sm text-cjc-navy font-medium">
                    {announcement.event_location}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content - Staggered animation */}
        <div className="mb-6 modal-fade-up modal-fade-up-delay-3">
          <p className="text-xs font-semibold text-ccis-blue-primary uppercase tracking-wider mb-3">
            Announcement
          </p>
          <div className="prose prose-sm max-w-none">
            <p className="text-warm-muted leading-relaxed whitespace-pre-wrap">
              {announcement.content}
            </p>
          </div>
        </div>

        {/* Meta Information - Staggered animation */}
        <div className="border-t border-border-warm pt-4 modal-fade-up modal-fade-up-delay-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-warm-muted">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Posted {formatDate(announcement.created_at)}</span>
            </div>
            {announcement.expires_at && (
              <div className="flex items-center gap-1.5">
                <span className="text-warning">
                  Expires {formatDate(announcement.expires_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Close Button - Fade in with hover lift */}
        <div className="mt-6 flex justify-end modal-fade-up modal-fade-up-delay-5">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-cjc-navy bg-surface-cream hover:bg-surface-warm border border-border-warm rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
