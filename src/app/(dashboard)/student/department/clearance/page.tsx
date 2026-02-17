"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { AlertCircle, Loader2 } from "lucide-react";
import ClearanceStatusView from "@/components/student/ClearanceStatusView";
import {
  Department,
  ClearanceRequest,
  ClearanceItem,
  Requirement,
  getDepartmentByCode,
  getStudentClearanceRequests,
  getClearanceItemForRequest,
  getRequirementsBySource,
} from "@/lib/supabase";

export default function DepartmentClearancePage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [dept, setDept] = useState<Department | null>(null);
  const [activeRequest, setActiveRequest] = useState<ClearanceRequest | null>(null);
  const [clearanceItem, setClearanceItem] = useState<ClearanceItem | null>(null);
  const [requirementCount, setRequirementCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.department) { setIsLoading(false); return; }

    let cancelled = false;

    async function load() {
      try {
        const [d, requests, reqs] = await Promise.all([
          getDepartmentByCode(profile!.department!),
          getStudentClearanceRequests(profile!.id),
          // we will fetch reqs after we know dept id
          Promise.resolve([] as Requirement[]),
        ]);

        if (cancelled) return;

        setDept(d);

        const active = requests.find((r) => r.status === "pending" || r.status === "in_progress") ?? null;
        setActiveRequest(active);

        if (d) {
          const [deptReqs, item] = await Promise.all([
            getRequirementsBySource("department", d.id),
            active ? getClearanceItemForRequest(active.id, "department", d.id) : Promise.resolve(null),
          ]);
          if (!cancelled) {
            setRequirementCount(deptReqs.length);
            setClearanceItem(item);
          }
        }
      } catch (err) {
        if (!cancelled) {
          showToast("error", "Load failed", "Failed to load clearance status.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [authLoading, profile?.id, profile?.department]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Department Clearance" subtitle="Your department clearance status" />
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Department Clearance" subtitle="Your department clearance status" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Please log in to access this page.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile.department) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Department Clearance" subtitle="Your department clearance status" />
        <div className="flex items-center justify-center p-12">
          <Card padding="lg" className="text-center max-w-sm w-full">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No department assigned to your account.</p>
          </Card>
        </div>
      </div>
    );
  }

  const sources = dept ? [{ id: dept.id, name: dept.name, code: dept.code }] : [];
  const requirementCounts = dept ? { [dept.id]: requirementCount } : {};
  const clearanceItems = clearanceItem ? [clearanceItem] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Department Clearance"
        subtitle={dept ? `${dept.name} (${dept.code})` : "Your department clearance status"}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClearanceStatusView
          sourceType="department"
          sources={sources}
          requirementCounts={requirementCounts}
          clearanceRequest={activeRequest}
          clearanceItems={clearanceItems}
          loading={false}
          submitHref="/student/department/submit"
        />
      </div>
    </div>
  );
}
