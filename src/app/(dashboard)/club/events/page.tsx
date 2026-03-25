"use client";

import { useAuth } from "@/contexts/auth-context";
import EventsPage from "@/components/features/EventsPage";

export default function ClubEventsPage() {
  const { orgId } = useAuth();
  if (!orgId) return <div className="p-6 text-gray-500">No club linked to your account.</div>;
  return <EventsPage sourceType="club" sourceId={orgId} />;
}
