"use client";

import { Modal } from "@/components/ui/modal";
import { AnnouncementWithRelations } from "@/lib/supabase";
import { Calendar, MapPin, Clock, User, X } from "lucide-react";

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
    club: "Club", student: "Student", csg_lgu: "CSG LGU", cspsp_division: "CSPSP Division",
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

  const priorityLabel: Record<string, string> = {
    urgent: "Urgent",
    high: "Important",
    normal: "Announcement",
    low: "Notice",
  };

  const priorityColor: Record<string, string> = {
    urgent: "text-red-600",
    high: "text-amber-600",
    normal: "text-cjc-red",
    low: "text-muted-foreground",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl overflow-hidden" showCloseButton={false}>
      {/* Header */}
      <div className="px-6 pt-6 pb-0 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Priority + Date */}
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${priorityColor[announcement.priority] || priorityColor.normal}`}>
            {priorityLabel[announcement.priority] || "Announcement"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(announcement.created_at)}
          </span>
        </div>

        {/* Title */}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-tight pr-8 mb-4">
          {announcement.title}
        </h2>

        <div className="h-px bg-border" />
      </div>

      {/* Content Area */}
      <div className="px-6 py-6">
        {/* Event Details */}
        {(announcement.event_date || announcement.event_location) && (
          <div className="flex flex-wrap gap-4 mb-5 text-sm">
            {announcement.event_date && (
              <span className="flex items-center gap-1.5 text-foreground">
                <Calendar className="w-4 h-4 text-cjc-red" />
                {formatDateTime(announcement.event_date)}
              </span>
            )}
            {announcement.event_location && (
              <span className="flex items-center gap-1.5 text-foreground">
                <MapPin className="w-4 h-4 text-cjc-red" />
                {announcement.event_location}
              </span>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="mb-6">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
            {announcement.content}
          </p>
        </div>

        {/* Meta */}
        <div className="h-px bg-border mb-4" />
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Posted {formatDate(announcement.created_at)}</span>
          </div>
          {announcement.posted_by && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>
                {announcement.posted_by.first_name} {announcement.posted_by.last_name}
                {" "}({roleLabel[announcement.posted_by.role] ?? announcement.posted_by.role})
              </span>
            </div>
          )}
          {announcement.expires_at && (
            <div className="flex items-center gap-1.5">
              <span>Expires {formatDate(announcement.expires_at)}</span>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded bg-cjc-red-dark text-white text-sm font-medium hover:bg-cjc-red transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
