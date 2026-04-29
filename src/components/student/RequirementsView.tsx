"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CheckSquare, Upload, ChevronDown, ChevronUp, ExternalLink, CheckCircle, Clock, XCircle, AlertCircle, PauseCircle, Loader2 } from "lucide-react";
import { Requirement, SubmissionWithRequirement, ClearanceItem } from "@/lib/supabase";

interface Source {
  id: string;
  name: string;
  code: string;
}

interface Props {
  sources: Source[];
  requirementsBySource: Record<string, Requirement[]>;
  loading: boolean;
  showSourceHeaders: boolean;
  // Optional: submission data keyed by clearance item id
  clearanceItemsBySource?: Record<string, ClearanceItem>;
  submissionsByItem?: Record<string, SubmissionWithRequirement[]>;
}

function SimpleLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
      <p className="text-sm text-gray-500 font-medium">Loading requirements...</p>
    </div>
  );
}

function SubmissionStatusBadge({
  sub,
  itemStatus,
}: {
  sub: SubmissionWithRequirement | undefined;
  itemStatus: ClearanceItem["status"] | undefined;
}) {
  if (!sub) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
        Not submitted
      </span>
    );
  }
  if (sub.status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" />
        Verified
      </span>
    );
  }
  if (sub.status === "submitted") {
    // Only show "Submitted" when the clearance item is actually in the review queue
    if (itemStatus === "submitted") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" />
          Submitted
        </span>
      );
    }
    // pending, rejected, on_hold — student uploaded/confirmed but item is not currently under review
    const label = (sub.file_urls?.length ?? 0) > 0 ? "Uploaded" : "Confirmed";
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <CheckCircle className="w-3 h-3" />
        {label}
      </span>
    );
  }
  if (sub.status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
        <XCircle className="w-3 h-3" />
        Rejected
      </span>
    );
  }
  // pending or any unknown status — treat as not yet submitted
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
      Not submitted
    </span>
  );
}

function ItemStatusBadge({ item }: { item: ClearanceItem | undefined }) {
  if (!item) return null;
  if (item.status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" />
        Approved
      </span>
    );
  }
  if (item.status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" />
        Submitted
      </span>
    );
  }
  if (item.status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
        <XCircle className="w-3 h-3" />
        Rejected
      </span>
    );
  }
  if (item.status === "on_hold") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"
        title="This item is on hold. Check remarks and resubmit from the Submit tab."
      >
        <PauseCircle className="w-3 h-3" />
        On Hold
      </span>
    );
  }
  return null;
}

export default function RequirementsView({
  sources,
  requirementsBySource,
  loading,
  clearanceItemsBySource,
  submissionsByItem,
}: Props) {
  // All sections start expanded
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(sources.map((s) => s.id))
  );

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasSubmissions = !!(clearanceItemsBySource && submissionsByItem);

  if (loading) {
    return <SimpleLoader />;
  }

  if (sources.length === 0) {
    return (
      <Card padding="lg" className="text-center max-w-sm mx-auto">
        <CheckSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No sources found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sources.map((source) => {
        const reqs = requirementsBySource[source.id] ?? [];
        const isOpen = openSections.has(source.id);
        const item = clearanceItemsBySource?.[source.id];
        const subs = item ? (submissionsByItem?.[item.id] ?? []) : [];

        return (
          <Card key={source.id} padding="none">
            {/* Accordion header — always clickable */}
            <button
              type="button"
              onClick={() => toggleSection(source.id)}
              className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors rounded-t-xl"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <CheckSquare className="w-4 h-4 text-cjc-gold flex-shrink-0" />
                <span className="font-semibold text-cjc-navy text-sm">
                  {source.code} — {source.name}
                </span>
                {!isOpen && reqs.length > 0 && (
                  <span className="text-xs text-gray-400 ml-1">
                    ({reqs.length} requirement{reqs.length !== 1 ? "s" : ""})
                  </span>
                )}
                <ItemStatusBadge item={item} />
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {/* Accordion body */}
            {isOpen && (
              reqs.length === 0 ? (
                <div className="px-6 py-5 border-t border-gray-100">
                  <p className="text-sm text-gray-400 italic">No requirements defined for this source.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                          <th className="px-4 sm:px-6 py-3 text-left w-10 hidden sm:table-cell">#</th>
                          <th className="px-4 sm:px-6 py-3 text-left">Requirement</th>
                          <th className="px-4 sm:px-6 py-3 text-left w-28 hidden sm:table-cell">Type</th>
                          <th className="px-4 sm:px-6 py-3 text-left w-28 hidden md:table-cell">Upload</th>
                          <th className="px-4 sm:px-6 py-3 text-left w-36 hidden md:table-cell">Link</th>
                          {hasSubmissions && (
                            <th className="px-4 sm:px-6 py-3 text-left w-36">My Submission</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reqs.map((req, index) => {
                          const sub = subs.find((s) => s.requirement_id === req.id);
                          return (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 sm:px-6 py-4 text-gray-400 font-mono hidden sm:table-cell">{index + 1}</td>
                              <td className="px-4 sm:px-6 py-4 min-w-0">
                                <p className="font-medium text-cjc-navy truncate">{req.name}</p>
                                {req.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">{req.description}</p>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                                {req.is_required ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Required
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    Optional
                                  </span>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                                {req.requires_upload ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cjc-red/10 text-cjc-red">
                                    <Upload className="w-3 h-3" />
                                    Required
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                                    None
                                  </span>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                                {(req.links ?? []).length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {(req.links ?? []).map(link => (
                                      <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cjc-gold/10 text-cjc-navy hover:bg-cjc-gold/20 transition-colors">
                                        <ExternalLink className="w-3 h-3" />
                                        {link.label || "Open Link"}
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              {hasSubmissions && (
                                <td className="px-4 sm:px-6 py-4">
                                  <SubmissionStatusBadge sub={sub} itemStatus={item?.status} />
                                  {sub && (sub.file_urls?.length ?? 0) > 0 && (sub.file_urls ?? []).map((url, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-xs text-cjc-blue hover:underline mt-1"
                                    >
                                      View file {(sub.file_urls?.length ?? 0) > 1 ? idx + 1 : ""}
                                    </a>
                                  ))}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 rounded-b-xl">
                    {reqs.filter((r) => r.is_required).length} required ·{" "}
                    {reqs.filter((r) => !r.is_required).length} optional ·{" "}
                    {reqs.filter((r) => r.requires_upload).length} need upload
                    {hasSubmissions && subs.length > 0 && (
                      <> · {subs.filter((s) => (s.file_urls?.length ?? 0) > 0 || s.status === "submitted" || s.status === "verified").length} submitted</>
                    )}
                  </div>
                </>
              )
            )}
          </Card>
        );
      })}
    </div>
  );
}
