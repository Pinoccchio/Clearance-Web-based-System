"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, XCircle, PauseCircle, MinusCircle, Info, History } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/modal";
import { ClearanceRequest, ClearanceItem, Requirement } from "@/lib/supabase";
import ClearanceItemHistoryTimeline from "@/components/shared/ClearanceItemHistoryTimeline";

interface Source {
  id: string;
  name: string;
  code: string;
}

interface Props {
  sourceType: "department" | "office" | "club";
  sources: Source[];
  requirementCounts: Record<string, number>;
  clearanceRequest: ClearanceRequest | null;
  clearanceItems: ClearanceItem[];
  loading: boolean;
  submitHref: string;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/4" />
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ClearanceStatusView({
  sourceType,
  sources,
  requirementCounts,
  clearanceRequest,
  clearanceItems,
  loading,
  submitHref,
}: Props) {
  const [historyItem, setHistoryItem] = useState<{ item: ClearanceItem; sourceName: string } | null>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} padding="md">
            <SkeletonCard />
          </Card>
        ))}
      </div>
    );
  }

  if (clearanceRequest === null) {
    return (
      <Card padding="lg" className="text-center max-w-md mx-auto">
        <Info className="w-10 h-10 text-blue-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-cjc-navy mb-1">No Active Clearance Request</h3>
        <p className="text-sm text-gray-500 mb-4">
          You have not started a clearance request yet. Submit one to begin tracking your clearance status.
        </p>
        <Link href={submitHref}>
          <Button variant="gold" size="md">Start Clearance</Button>
        </Link>
      </Card>
    );
  }

  if (sources.length === 0) {
    return (
      <Card padding="lg" className="text-center max-w-md mx-auto">
        <MinusCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-cjc-navy mb-1">No Sources Found</h3>
        <p className="text-sm text-gray-500">No {sourceType} sources are registered.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sources.map((source) => {
          const count = requirementCounts[source.id] ?? 0;
          const item = clearanceItems.find(
            (i) => i.source_type === sourceType && i.source_id === source.id
          );

          let badgeVariant: "neutral" | "default" | "warning" | "success" | "danger" | "onHold" = "default";
          let badgeLabel = "Not Started";

          if (count === 0) {
            badgeVariant = "neutral";
            badgeLabel = "No Requirements";
          } else if (!item) {
            badgeVariant = "default";
            badgeLabel = "Not Started";
          } else if (item.status === "pending") {
            badgeVariant = "neutral";
            badgeLabel = "Not Submitted";
          } else if (item.status === "submitted") {
            badgeVariant = "warning";
            badgeLabel = "Pending Review";
          } else if (item.status === "approved") {
            badgeVariant = "success";
            badgeLabel = "Cleared";
          } else if (item.status === "rejected") {
            badgeVariant = "danger";
            badgeLabel = "Rejected";
          } else if (item.status === "on_hold") {
            badgeVariant = "onHold";
            badgeLabel = "On Hold";
          }

          return (
            <Card key={source.id} padding="md" className="space-y-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-cjc-navy text-sm">
                    {source.code} — {source.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {count === 0 ? "No requirements" : `${count} requirement${count !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={badgeVariant} size="md">{badgeLabel}</Badge>
                  {item && (
                    <button
                      type="button"
                      onClick={() => setHistoryItem({ item, sourceName: `${source.code} — ${source.name}` })}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-cjc-navy transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
                      title="View status history"
                    >
                      <History className="w-3.5 h-3.5" />
                      History
                    </button>
                  )}
                </div>
              </div>

              {/* Rejected / on-hold remarks */}
              {(item?.status === "rejected" || item?.status === "on_hold") && item.remarks && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <span className="font-semibold">Remarks: </span>{item.remarks}
                </div>
              )}

              {/* Cleared date */}
              {item?.status === "approved" && item.reviewed_at && (
                <p className="text-xs text-gray-400 mt-1">
                  Cleared on {formatDate(item.reviewed_at)}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* History Timeline Modal */}
      <Modal
        isOpen={!!historyItem}
        onClose={() => setHistoryItem(null)}
        className="max-w-lg"
      >
        {historyItem && (
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-display font-bold text-cjc-navy">Status History</h2>
              <p className="text-sm text-gray-500 mt-0.5">{historyItem.sourceName}</p>
            </div>
            <ClearanceItemHistoryTimeline clearanceItemId={historyItem.item.id} />
          </div>
        )}
      </Modal>
    </>
  );
}
