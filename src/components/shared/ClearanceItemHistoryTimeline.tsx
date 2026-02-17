"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  PauseCircle,
  Upload,
  Clock,
  Loader2,
} from "lucide-react";
import { ClearanceItemHistoryWithActor, getClearanceItemHistory } from "@/lib/supabase";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "rejected":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "on_hold":
      return <PauseCircle className="w-4 h-4 text-amber-500" />;
    case "submitted":
      return <Upload className="w-4 h-4 text-blue-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "approved": return "Approved";
    case "rejected": return "Rejected";
    case "on_hold": return "On Hold";
    case "submitted": return "Submitted";
    case "pending": return "Pending";
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "approved": return "text-green-700 bg-green-50 border-green-200";
    case "rejected": return "text-red-700 bg-red-50 border-red-200";
    case "on_hold": return "text-amber-700 bg-amber-50 border-amber-200";
    case "submitted": return "text-blue-700 bg-blue-50 border-blue-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

function dotColor(status: string): string {
  switch (status) {
    case "approved": return "bg-green-500";
    case "rejected": return "bg-red-500";
    case "on_hold": return "bg-amber-400";
    case "submitted": return "bg-blue-500";
    default: return "bg-gray-400";
  }
}

interface Props {
  clearanceItemId: string;
}

export default function ClearanceItemHistoryTimeline({ clearanceItemId }: Props) {
  const [history, setHistory] = useState<ClearanceItemHistoryWithActor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getClearanceItemHistory(clearanceItemId)
      .then(setHistory)
      .catch(() => setError("Could not load history."))
      .finally(() => setIsLoading(false));
  }, [clearanceItemId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading history...</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 py-2">{error}</p>;
  }

  if (history.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2 italic">No history recorded yet.</p>
    );
  }

  return (
    <div className="relative pl-6 space-y-0">
      {/* Vertical line */}
      <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />

      {history.map((entry, i) => {
        const actorName = entry.actor
          ? `${entry.actor.first_name} ${entry.actor.last_name}`
          : entry.actor_role === "student"
          ? "Student"
          : "System";

        return (
          <div key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
            {/* Dot */}
            <div
              className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white ${dotColor(entry.to_status)}`}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* from → to */}
                {entry.from_status && (
                  <>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${statusColor(entry.from_status)}`}>
                      {statusLabel(entry.from_status)}
                    </span>
                    <span className="text-gray-400 text-xs">→</span>
                  </>
                )}
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${statusColor(entry.to_status)}`}>
                  <StatusIcon status={entry.to_status} />
                  {statusLabel(entry.to_status)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-xs text-gray-600 font-medium">{actorName}</span>
                {entry.actor?.role && (
                  <span className="text-xs text-gray-400 capitalize">
                    ({entry.actor.role})
                  </span>
                )}
                {!entry.actor && entry.actor_role && (
                  <span className="text-xs text-gray-400 capitalize">
                    ({entry.actor_role})
                  </span>
                )}
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400">{formatDateTime(entry.created_at)}</span>
              </div>

              {entry.remarks && (
                <p className="mt-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                  {entry.remarks}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
