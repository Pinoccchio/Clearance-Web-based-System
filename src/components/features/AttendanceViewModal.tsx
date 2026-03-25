"use client";

import { useState, useEffect } from "react";
import { X, Clock, Trash2 } from "lucide-react";
import { AttendanceRecord, getAttendanceForEvent, deleteStudentAttendance } from "@/lib/supabase";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface AttendanceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | null;
  eventName: string;
}

interface GroupedAttendance {
  student: AttendanceRecord["student"];
  logIn: AttendanceRecord | null;
  logOut: AttendanceRecord | null;
}

export default function AttendanceViewModal({ isOpen, onClose, eventId, eventName }: AttendanceViewModalProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ studentId: string; studentName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      setIsLoading(true);
      getAttendanceForEvent(eventId)
        .then(setRecords)
        .catch(() => setRecords([]))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const grouped: GroupedAttendance[] = [];
  const studentMap = new Map<string, GroupedAttendance>();
  for (const rec of records) {
    const sid = rec.student?.id ?? rec.student_id;
    if (!studentMap.has(sid)) {
      const entry: GroupedAttendance = { student: rec.student, logIn: null, logOut: null };
      studentMap.set(sid, entry);
      grouped.push(entry);
    }
    const entry = studentMap.get(sid)!;
    if (rec.attendance_type === "log_in" && !entry.logIn) entry.logIn = rec;
    if (rec.attendance_type === "log_out" && !entry.logOut) entry.logOut = rec;
  }

  const formatTime = (rec: AttendanceRecord | null) => {
    if (!rec) return "—";
    const dt = new Date(rec.scanned_at);
    return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleConfirmDelete = async () => {
    if (!eventId || !confirmDelete) return;
    setIsDeleting(true);
    try {
      await deleteStudentAttendance(eventId, confirmDelete.studentId);
      setRecords(prev => prev.filter(r => (r.student?.id ?? r.student_id) !== confirmDelete.studentId));
      setConfirmDelete(null);
    } catch {
      setConfirmDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-cjc-red-dark to-[#96161C]">
            <div>
              <h2 className="text-lg font-semibold text-white">Attendance</h2>
              <p className="text-white/70 text-sm">{eventName} — {grouped.length} attendee{grouped.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cjc-red"></div>
              </div>
            ) : grouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Clock className="w-12 h-12 mb-3" />
                <p>No attendance records yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-green-600 uppercase">Time In</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-blue-600 uppercase">Time Out</th>
                    <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grouped.map((g, i) => {
                    const sid = g.student?.id ?? g.logIn?.student_id ?? "";
                    const name = `${g.student?.first_name ?? ""} ${g.student?.last_name ?? ""}`.trim();
                    return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${g.student?.first_name ?? ""} ${g.student?.last_name ?? ""}`} src={g.student?.avatar_url ?? undefined} size="sm" />
                          <span className="text-sm font-medium text-gray-900">{g.student?.first_name} {g.student?.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{g.student?.student_id ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{g.student?.course ?? "—"}{g.student?.year_level ? ` · ${g.student.year_level}` : ""}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm ${g.logIn ? "text-green-700 font-medium" : "text-gray-300"}`}>{formatTime(g.logIn)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm ${g.logOut ? "text-blue-700 font-medium" : "text-gray-300"}`}>{formatTime(g.logOut)}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => setConfirmDelete({ studentId: sid, studentName: name })}
                          disabled={deletingStudentId === sid}
                          className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                          title="Remove attendance"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Attendance"
        message={`Remove attendance for ${confirmDelete?.studentName ?? ""}? This will also remove any linked requirement submission.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
