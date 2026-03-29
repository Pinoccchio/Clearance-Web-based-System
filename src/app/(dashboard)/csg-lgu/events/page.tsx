"use client";

import { useAuth } from "@/contexts/auth-context";
import EventsPage from "@/components/features/EventsPage";

export default function CsgLguEventsPage() {
  const { orgId } = useAuth();
  if (!orgId) return <div className="p-6 text-gray-500">No CSG LGU linked to your account.</div>;
  return <EventsPage sourceType="csg_lgu" sourceId={orgId} />;
}
