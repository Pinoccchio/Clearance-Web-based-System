"use client";

import { Modal } from "@/components/ui/modal";
import { AnnouncementWithRelations } from "@/lib/supabase";
import { Calendar, MapPin, Clock, User, X, AlertTriangle, Bell, Info, Megaphone } from "lucide-react";

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

  const roleLabel: Record<string, string> = {
    admin: "Admin", department: "Department", office: "Office",
    club: "Club", student: "Student",
  };

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
      headerClass: "modal-header-urgent",
      icon: AlertTriangle,
      iconBg: "bg-white/20",
      label: "Urgent Notice",
      textColor: "text-white",
    },
    high: {
      headerClass: "modal-header-high",
      icon: Bell,
      iconBg: "bg-cjc-navy/10",
      label: "High Priority",
      textColor: "text-cjc-navy",
    },
    normal: {
      headerClass: "modal-header-normal",
      icon: Megaphone,
      iconBg: "bg-white/20",
      label: "Announcement",
      textColor: "text-white",
    },
    low: {
      headerClass: "modal-header-low",
      icon: Info,
      iconBg: "bg-white/20",
      label: "Notice",
      textColor: "text-white",
    },
  };

  const priority = priorityConfig[announcement.priority] || priorityConfig.normal;
  const PriorityIcon = priority.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl overflow-hidden">
      {/* Priority Header Band - Full width gradient */}
      <div className={`${priority.headerClass} px-6 py-5 relative`}>
        {/* Close button - positioned in header */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className={`w-4 h-4 ${priority.textColor}`} />
        </button>

        <div className="flex items-center gap-4 modal-fade-up">
          {/* Priority Icon Circle */}
          <div className={`w-14 h-14 rounded-full ${priority.iconBg} flex items-center justify-center modal-scale-in`}>
            <PriorityIcon className={`w-6 h-6 ${priority.textColor}`} />
          </div>

          <div>
            {/* Priority Label */}
            <span className={`inline-block text-xs font-bold uppercase tracking-wider ${priority.textColor} opacity-80 mb-1`}>
              {priority.label}
            </span>
            {/* Title */}
            <h2 className={`font-display text-xl sm:text-2xl font-bold ${priority.textColor} leading-tight pr-8`}>
              {announcement.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 sm:p-8 relative">
        {/* Decorative Quotation Marks */}
        <div className="decorative-quote decorative-quote-left">&ldquo;</div>
        <div className="decorative-quote decorative-quote-right">&rdquo;</div>

        {/* Event Details Pills - If Present */}
        {(announcement.event_date || announcement.event_location) && (
          <div className="flex flex-wrap gap-3 mb-6 modal-fade-up modal-fade-up-delay-1">
            {announcement.event_date && (
              <div className="event-pill">
                <Calendar className="event-pill-icon" />
                <span>{formatDateTime(announcement.event_date)}</span>
              </div>
            )}
            {announcement.event_location && (
              <div className="event-pill">
                <MapPin className="event-pill-icon" />
                <span>{announcement.event_location}</span>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="mb-8 modal-fade-up modal-fade-up-delay-2 relative z-10">
          <div className="prose prose-sm max-w-none">
            <p className="text-cjc-navy leading-relaxed whitespace-pre-wrap text-base">
              {announcement.content}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border-warm to-transparent mb-6 modal-fade-up modal-fade-up-delay-3" />

        {/* Meta Information */}
        <div className="flex flex-wrap items-center justify-between gap-4 modal-fade-up modal-fade-up-delay-3">
          <div className="flex flex-wrap items-center gap-4 text-sm text-warm-muted">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Posted {formatDate(announcement.created_at)}</span>
            </div>
            {announcement.posted_by && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>
                  {announcement.posted_by.first_name} {announcement.posted_by.last_name}
                  {" "}
                  <span className="font-medium text-cjc-navy capitalize">
                    ({roleLabel[announcement.posted_by.role] ?? announcement.posted_by.role})
                  </span>
                </span>
              </div>
            )}
            {announcement.expires_at && (
              <div className="flex items-center gap-2 text-warning">
                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                <span>Expires {formatDate(announcement.expires_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Close Button - Enhanced */}
        <div className="mt-8 flex justify-end modal-fade-up modal-fade-up-delay-4">
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            Close Announcement
          </button>
        </div>
      </div>
    </Modal>
  );
}
