"use client";

import { useAuth } from "@/contexts/auth-context";
import EventsPage from "@/components/features/EventsPage";

export default function CspsgDivisionEventsPage() {
  const { orgId } = useAuth();
  if (!orgId) return <div className="p-6 text-gray-500">No CSPSG division linked to your account.</div>;
  return <EventsPage sourceType="csp_division" sourceId={orgId} />;
}
