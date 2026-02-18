"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/modal";
import {
  History,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  PauseCircle,
  Clock,
  Upload,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  ClearanceRequest,
  ClearanceItem,
  getStudentClearanceRequests,
  getClearanceItemsForStudent,
  getAllDepartments,
  getAllOffices,
  getAllClubs,
} from "@/lib/supabase";
import ClearanceItemHistoryTimeline from "@/components/shared/ClearanceItemHistoryTimeline";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ItemStatusBadge({ status }: { status: ClearanceItem["status"] }) {
  switch (status) {
    case "approved":
      return (
        <Badge variant="approved" size="sm">
          <CheckCircle className="w-3 h-3" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="rejected" size="sm">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      );
    case "on_hold":
      return (
        <Badge variant="onHold" size="sm">
          <PauseCircle className="w-3 h-3" />
          On Hold
        </Badge>
      );
    case "submitted":
      return (
        <Badge variant="pending" size="sm">
          <Upload className="w-3 h-3" />
          Submitted
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size="sm">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
  }
}

function RequestTypeBadge({ type: _ }: { type: ClearanceRequest["type"] }) {
  return <Badge variant="default" size="sm">Semester</Badge>;
}

interface ItemWithRequest extends ClearanceItem {
  request: ClearanceRequest;
}

interface RequestGroup {
  request: ClearanceRequest;
  items: ItemWithRequest[];
}

function groupByRequest(items: ItemWithRequest[]): RequestGroup[] {
  const map = new Map<string, RequestGroup>();
  for (const item of items) {
    const req = item.request;
    if (!map.has(req.id)) {
      map.set(req.id, { request: req, items: [] });
    }
    map.get(req.id)!.items.push(item);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.request.created_at).getTime() - new Date(a.request.created_at).getTime()
  );
}

export default function StudentHistoryPage() {
  const { profile } = useAuth();

  const [groups, setGroups] = useState<RequestGroup[]>([]);
  // Map of source_id → "CODE — Name"
  const [sourceNames, setSourceNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  // Modal state
  const [selectedItem, setSelectedItem] = useState<ItemWithRequest | null>(null);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [items, depts, offices, clubs] = await Promise.all([
        getClearanceItemsForStudent(profile.id),
        getAllDepartments(),
        getAllOffices(),
        getAllClubs(),
      ]);

      // Build id → "CODE — Name" lookup
      const names: Record<string, string> = {};
      for (const d of depts) names[d.id] = `${d.code} — ${d.name}`;
      for (const o of offices) names[o.id] = `${o.code} — ${o.name}`;
      for (const c of clubs) names[c.id] = `${c.code} — ${c.name}`;
      setSourceNames(names);

      const grouped = groupByRequest(items as ItemWithRequest[]);
      setGroups(grouped);
      // Auto-expand most recent request
      if (grouped.length > 0) {
        setExpandedRequests(new Set([grouped[0].request.id]));
      }
    } catch (err) {
      console.error("Error loading clearance history:", err);
      setError("Failed to load clearance history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleRequest(requestId: string) {
    setExpandedRequests((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) next.delete(requestId);
      else next.add(requestId);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-white border-b border-border-warm">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-warm-muted">Student</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">Clearance History</h1>
          </div>
          <Button variant="secondary" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-cjc-navy animate-spin" />
            <span className="ml-3 text-gray-600">Loading history...</span>
          </div>
        ) : error ? (
          <Card padding="lg" className="text-center">
            <p className="text-red-600">{error}</p>
          </Card>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<History className="w-8 h-8 text-gray-400" />}
            title="No Clearance History"
            description="Your clearance submissions and their status changes will appear here."
          />
        ) : (
          groups.map(({ request, items }) => {
            const isExpanded = expandedRequests.has(request.id);
            const approvedCount = items.filter((i) => i.status === "approved").length;
            const total = items.length;

            return (
              <Card key={request.id} padding="none" className="overflow-hidden">
                {/* Request header */}
                <button
                  type="button"
                  onClick={() => toggleRequest(request.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <RequestTypeBadge type={request.type} />
                    <span className="font-semibold text-cjc-navy text-sm">
                      {request.academic_year} — {request.semester}
                    </span>
                    <span className="text-xs text-gray-500">
                      Started {formatDate(request.created_at)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {approvedCount}/{total} cleared
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Items list */}
                {isExpanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <ItemStatusBadge status={item.status} />
                          <div>
                            <p className="text-sm font-medium text-cjc-navy">
                              {sourceNames[item.source_id] ?? item.source_id}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.source_type === "department" ? "Department" : item.source_type === "office" ? "Office" : "Club"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          View History
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* History Timeline Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        className="max-w-lg"
      >
        {selectedItem && (
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-display font-bold text-cjc-navy">
                Status History
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {sourceNames[selectedItem.source_id] ?? selectedItem.source_id}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">
                {selectedItem.source_type} · {selectedItem.request.academic_year} — {selectedItem.request.semester}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Current status:</span>
              <ItemStatusBadge status={selectedItem.status} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h3>
              <ClearanceItemHistoryTimeline clearanceItemId={selectedItem.id} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
