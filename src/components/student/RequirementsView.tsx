"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckSquare, Upload } from "lucide-react";
import { Requirement } from "@/lib/supabase";

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
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-gray-100 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="px-6 py-4 flex gap-4 items-center">
          <div className="w-6 h-4 bg-gray-200 rounded" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
          <div className="h-5 w-16 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function RequirementsView({ sources, requirementsBySource, loading, showSourceHeaders }: Props) {
  if (loading) {
    return (
      <Card padding="none">
        <CardHeader className="px-6 pt-5 pb-4">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cjc-gold" />
            Requirements
          </CardTitle>
        </CardHeader>
        <SkeletonRows />
      </Card>
    );
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

        return (
          <Card key={source.id} padding="none">
            {showSourceHeaders && (
              <div className="px-6 pt-5 pb-3 border-b border-gray-100">
                <p className="font-semibold text-cjc-navy text-sm">
                  {source.code} — {source.name}
                </p>
              </div>
            )}

            {!showSourceHeaders && (
              <CardHeader className="px-6 pt-5 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-cjc-gold" />
                  {source.code} — {source.name}
                </CardTitle>
              </CardHeader>
            )}

            {reqs.length === 0 ? (
              <div className="px-6 py-5">
                <p className="text-sm text-gray-400 italic">No requirements defined for this source.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="px-6 py-3 text-left w-10">#</th>
                        <th className="px-6 py-3 text-left">Requirement</th>
                        <th className="px-6 py-3 text-left w-28">Type</th>
                        <th className="px-6 py-3 text-left w-28">Upload</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reqs.map((req, index) => (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-400 font-mono">{index + 1}</td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-cjc-navy">{req.name}</p>
                            {req.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{req.description}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
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
                          <td className="px-6 py-4">
                            {req.requires_upload ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                <Upload className="w-3 h-3" />
                                Required
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                                None
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 rounded-b-xl">
                  {reqs.filter((r) => r.is_required).length} required ·{" "}
                  {reqs.filter((r) => !r.is_required).length} optional ·{" "}
                  {reqs.filter((r) => r.requires_upload).length} need upload
                </div>
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
