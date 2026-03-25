"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { EventRecord, getAttendanceRequirementsBySource, getAttendanceCountForEvent } from "@/lib/supabase";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    event_date: string;
    requirement_id: string | null;
    require_logout: boolean;
  }) => Promise<void>;
  event?: EventRecord | null;
  sourceType: string;
  sourceId: string;
}

export default function EventFormModal({ isOpen, onClose, onSave, event, sourceType, sourceId }: EventFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [requirementId, setRequirementId] = useState<string | null>(null);
  const [requireLogout, setRequireLogout] = useState(false);
  const [requirements, setRequirements] = useState<{ id: string; name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requirementLocked, setRequirementLocked] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setName(event?.name ?? "");
      setDescription(event?.description ?? "");
      setEventDate(event?.event_date ? new Date(event.event_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
      setRequirementId(event?.requirement_id ?? null);
      setRequireLogout(event?.require_logout ?? false);
      setError(null);
      setRequirementLocked(false);
      setAttendanceCount(0);
      getAttendanceRequirementsBySource(sourceType, sourceId).then(setRequirements).catch(() => setRequirements([]));
      if (event?.id) {
        getAttendanceCountForEvent(event.id).then((count) => {
          setAttendanceCount(count);
          setRequirementLocked(count > 0 && !!event.requirement_id);
        }).catch(() => {});
      }
    }
  }, [isOpen, event, sourceType, sourceId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Event name is required"); return; }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), description: description.trim(), event_date: eventDate, requirement_id: requirementId, require_logout: requireLogout });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-cjc-red-dark to-[#96161C]">
          <h2 className="text-lg font-semibold text-white">{event ? "Edit Event" : "Create Event"}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cjc-red focus:border-transparent" placeholder="Enter event name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cjc-red focus:border-transparent" placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cjc-red focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Linked Requirement</label>
            <select value={requirementId ?? ""} onChange={e => setRequirementId(e.target.value || null)} disabled={requirementLocked} className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cjc-red focus:border-transparent ${requirementLocked ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}>
              <option value="">None</option>
              {requirements.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {requirementLocked && (
              <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-center gap-1.5">
                <span>🔒</span> Requirement cannot be changed after attendance has been recorded ({attendanceCount} scan{attendanceCount === 1 ? "" : "s"}).
              </p>
            )}
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={requireLogout} onChange={e => setRequireLogout(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-cjc-red focus:ring-cjc-red" />
            <div>
              <span className="text-sm font-medium text-gray-700">Require Time Out</span>
              <p className="text-xs text-gray-500 mt-0.5">Only count attendance when both time in and time out are recorded</p>
            </div>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm text-white bg-cjc-red hover:bg-cjc-red-dark rounded-lg disabled:opacity-50">
              {isSaving ? "Saving..." : event ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
