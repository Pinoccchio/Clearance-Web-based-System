"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, Trash2, Edit, Users } from "lucide-react";
import { EventRecord, getEventsForSource, getAllEvents, createEventRecord, updateEventRecord, deleteEventRecord } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import Header from "@/components/layout/header";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import EventFormModal from "./EventFormModal";
import AttendanceViewModal from "./AttendanceViewModal";

interface EventsPageProps {
  sourceType?: string;
  sourceId?: string;
  admin?: boolean;
}

export default function EventsPage({ sourceType, sourceId, admin }: EventsPageProps) {
  useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [viewAttendanceEvent, setViewAttendanceEvent] = useState<EventRecord | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<EventRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      if (admin) {
        setEvents(await getAllEvents());
      } else if (sourceType && sourceId) {
        setEvents(await getEventsForSource(sourceType, sourceId));
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setIsLoading(false);
    }
  }, [admin, sourceType, sourceId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleSave = async (data: { name: string; description: string; event_date: string; requirement_id: string | null; require_logout: boolean }) => {
    if (editingEvent) {
      await updateEventRecord(editingEvent.id, data, editingEvent.requirement_id);
    } else if (sourceType && sourceId) {
      await createEventRecord({ source_type: sourceType, source_id: sourceId, ...data });
    }
    setEditingEvent(null);
    await loadEvents();
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      await deleteEventRecord(deletingEvent.id);
      setDeletingEvent(null);
      await loadEvents();
    } catch (err) {
      console.error("Failed to delete event:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      <Header
        title={admin ? "All Events" : "Events"}
        subtitle={admin ? "Events across all organizations" : "Manage attendance events"}
        actions={
          !admin && sourceType && sourceId ? (
            <button onClick={() => { setEditingEvent(null); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-cjc-red text-white text-sm font-medium rounded-lg hover:bg-cjc-red-dark transition-colors">
              <Plus className="w-4 h-4" />
              Create Event
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cjc-red"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No events yet</p>
          {!admin && <p className="text-gray-400 text-sm mt-1">Create your first event to start tracking attendance</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Event</th>
                {admin && <th className="hidden sm:table-cell text-left px-4 sm:px-4 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>}
                <th className="hidden sm:table-cell text-left px-4 sm:px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="hidden lg:table-cell text-left px-4 sm:px-4 py-3 text-xs font-medium text-gray-500 uppercase">Requirement</th>
                <th className="hidden md:table-cell text-center px-4 sm:px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map(event => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{event.name}</p>
                      {event.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{event.description}</p>}
                      <div className="flex items-center gap-2 mt-1 sm:hidden">
                        <span className="text-xs text-gray-500">{formatDate(event.event_date)}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${event.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {event.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </td>
                  {admin && (
                    <td className="hidden sm:table-cell px-4 sm:px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize whitespace-nowrap">
                        {event.source_type}: {event.source_name || "—"}
                      </span>
                    </td>
                  )}
                  <td className="hidden sm:table-cell px-4 sm:px-4 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(event.event_date)}</td>
                  <td className="hidden lg:table-cell px-4 sm:px-4 py-4 text-sm text-gray-600">{event.requirement?.name || "—"}</td>
                  <td className="hidden md:table-cell px-4 sm:px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${event.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {event.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewAttendanceEvent(event)} className="p-1.5 text-gray-400 hover:text-cjc-red rounded-lg hover:bg-gray-100" title="View Attendance">
                        <Users className="w-4 h-4" />
                      </button>
                      {!admin && (
                        <>
                          <button onClick={() => { setEditingEvent(event); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-cjc-red rounded-lg hover:bg-gray-100" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingEvent(event)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sourceType && sourceId && (
        <EventFormModal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditingEvent(null); }}
          onSave={handleSave}
          event={editingEvent}
          sourceType={sourceType}
          sourceId={sourceId}
        />
      )}

      <AttendanceViewModal
        isOpen={!!viewAttendanceEvent}
        onClose={() => setViewAttendanceEvent(null)}
        eventId={viewAttendanceEvent?.id ?? null}
        eventName={viewAttendanceEvent?.name ?? ""}
      />

      <ConfirmDialog
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${deletingEvent?.name}"? This will also delete all attendance records for this event.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
