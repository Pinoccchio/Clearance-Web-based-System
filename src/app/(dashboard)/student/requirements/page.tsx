"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckSquare, Info } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getDepartmentByCode, getRequirementsBySource, Department, Requirement } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";

export default function StudentRequirementsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [department, setDepartment] = useState<Department | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    if (!profile.department) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const dept = await getDepartmentByCode(profile.department!);
        if (!dept) {
          setError("Department not found. Contact your administrator.");
          return;
        }
        setDepartment(dept);
        const reqs = await getRequirementsBySource("department", dept.id);
        setRequirements(reqs);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load requirements.";
        setError(msg);
        showToast("error", "Load Failed", msg);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [profile]);

  const requiredCount = requirements.filter((r) => r.is_required).length;
  const optionalCount = requirements.filter((r) => !r.is_required).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Requirements"
        subtitle={department?.name ?? "Your department requirements"}
      />

      <div className="p-6 space-y-4">
        {/* No department assigned */}
        {!isLoading && !profile?.department && (
          <Card padding="lg">
            <p className="text-sm text-gray-600">
              No department assigned to your account. Contact your administrator.
            </p>
          </Card>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-cjc-navy/20 border-t-cjc-navy rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <Card padding="lg">
            <p className="text-red-600 text-sm">{error}</p>
          </Card>
        )}

        {/* Requirements */}
        {!isLoading && !error && profile?.department && (
          <>
            {/* Info banner */}
            {requirements.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                <span>
                  These are the requirements you must complete to obtain department clearance.
                </span>
              </div>
            )}

            {/* Table card */}
            {requirements.length > 0 ? (
              <Card padding="none">
                <CardHeader className="px-6 pt-5 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-cjc-gold" />
                    Department Requirements
                  </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="px-6 py-3 text-left w-10">#</th>
                        <th className="px-6 py-3 text-left">Requirement</th>
                        <th className="px-6 py-3 text-left w-28">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {requirements.map((req, index) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Footer summary */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 rounded-b-xl">
                  {requiredCount} required · {optionalCount} optional
                </div>
              </Card>
            ) : (
              /* Empty state */
              <div className="flex items-center justify-center p-12">
                <Card padding="lg" className="text-center max-w-sm w-full">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <CheckSquare className="w-7 h-7 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-cjc-navy mb-1">No Requirements Yet</h3>
                  <p className="text-sm text-gray-500">
                    Your department hasn&apos;t added any requirements yet. Check back later.
                  </p>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
