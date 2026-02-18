"use client";

import { useState, useEffect } from "react";
import { Calendar, Info, AlertTriangle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/auth-context";
import {
  getSystemSettings,
  updateSystemSettings,
  SystemSettings,
} from "@/lib/supabase";
import { cn } from "@/lib/utils";

// ── Inline toggle component ──────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between p-4 rounded-lg bg-gray-50 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-cjc-navy">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-checked={checked}
        role="switch"
        className={cn(
          "w-11 h-6 rounded-full transition-colors relative flex-shrink-0",
          checked ? "bg-cjc-navy" : "bg-gray-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </label>
  );
}

// ── Helper: days until a date ────────────────────────────────────────────────
function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tab 1 — Academic Period
  const [academicForm, setAcademicForm] = useState({
    academic_year: "",
    current_semester: "",
  });
  const [isSavingAcademic, setIsSavingAcademic] = useState(false);

  // Tab 2 — Clearance Windows & Deadlines
  const [windowForm, setWindowForm] = useState({
    semester_start_date: "",
    semester_deadline: "",
    allow_semester_clearance: true,
  });
  const [isSavingWindows, setIsSavingWindows] = useState(false);

  // ── Load settings on mount ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const data = await getSystemSettings();
        if (data) {
          setSettings(data);
          setAcademicForm({
            academic_year: data.academic_year,
            current_semester: data.current_semester,
          });
          setWindowForm({
            semester_start_date: data.semester_start_date ?? "",
            semester_deadline: data.semester_deadline ?? "",
            allow_semester_clearance: data.allow_semester_clearance,
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        showToast("error", "Failed to load settings", "Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save Academic Period ───────────────────────────────────────────────────
  async function saveAcademic() {
    if (!settings || !user) return;
    setIsSavingAcademic(true);
    try {
      const updated = await updateSystemSettings(
        settings.id,
        {
          academic_year: academicForm.academic_year,
          current_semester: academicForm.current_semester,
        },
        user.id
      );
      setSettings(updated);
      showToast("success", "Settings saved", "Academic period has been updated.");
    } catch (err) {
      console.error("Save academic failed:", err);
      showToast("error", "Save failed", "Could not save academic period settings.");
    } finally {
      setIsSavingAcademic(false);
    }
  }

  // ── Save Clearance Windows ─────────────────────────────────────────────────
  async function saveWindows() {
    if (!settings || !user) return;
    setIsSavingWindows(true);
    try {
      const updated = await updateSystemSettings(
        settings.id,
        {
          semester_start_date: windowForm.semester_start_date || null,
          semester_deadline: windowForm.semester_deadline || null,
          allow_semester_clearance: windowForm.allow_semester_clearance,
        },
        user.id
      );
      setSettings(updated);
      setWindowForm({
        semester_start_date: updated.semester_start_date ?? "",
        semester_deadline: updated.semester_deadline ?? "",
        allow_semester_clearance: updated.allow_semester_clearance,
      });
      showToast("success", "Settings saved", "Clearance windows and toggles updated.");
    } catch (err) {
      console.error("Save windows failed:", err);
      showToast("error", "Save failed", "Could not save clearance window settings.");
    } finally {
      setIsSavingWindows(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm px-6 py-5">
          <p className="text-sm text-warm-muted">Configure system parameters</p>
          <h1 className="text-2xl font-display font-bold text-cjc-navy">System Settings</h1>
        </header>
        <div className="p-6 flex items-center justify-center min-h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Status tab data ────────────────────────────────────────────────────────
  const statusRows = [
    {
      label: "Semester Clearance",
      enabled: windowForm.allow_semester_clearance,
      start: windowForm.semester_start_date,
      deadline: windowForm.semester_deadline,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm px-6 py-5">
        <p className="text-sm text-warm-muted">Configure system parameters</p>
        <h1 className="text-2xl font-display font-bold text-cjc-navy">System Settings</h1>
      </header>

      <div className="p-6">
        <Tabs defaultValue="academic">
          <TabsList className="mb-0">
            <TabsTrigger value="academic">Academic Period</TabsTrigger>
            <TabsTrigger value="windows">Clearance Windows</TabsTrigger>
            <TabsTrigger value="status">Status Overview</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Academic Period ──────────────────────────────────── */}
          <TabsContent value="academic">
            <div className="card p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cjc-gold" />
                <h3 className="font-display font-bold text-cjc-navy">Academic Period</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Academic Year"
                  value={academicForm.academic_year}
                  onChange={(e) =>
                    setAcademicForm((prev) => ({ ...prev, academic_year: e.target.value }))
                  }
                  placeholder="e.g. 2024-2025"
                  helperText='Format: "YYYY-YYYY"'
                />
                <Select
                  label="Current Semester"
                  value={academicForm.current_semester}
                  onChange={(e) =>
                    setAcademicForm((prev) => ({ ...prev, current_semester: e.target.value }))
                  }
                  options={[
                    { value: "1st Semester", label: "1st Semester" },
                    { value: "2nd Semester", label: "2nd Semester" },
                    { value: "Summer", label: "Summer" },
                  ]}
                />
              </div>

              {/* Info banner */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Changing the academic period affects all <strong>new</strong> clearance requests.
                  Existing requests keep their original period and are not touched.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="gold" isLoading={isSavingAcademic} onClick={saveAcademic}>
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 2: Clearance Windows & Deadlines ───────────────────── */}
          <TabsContent value="windows">
            <div className="space-y-4">
              {/* Warning banner */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Disabling a clearance type prevents students from opening <strong>new</strong>{" "}
                  requests of that type. In-progress requests are unaffected.
                </p>
              </div>

              {/* Semester Clearance */}
              <div className="card p-6 space-y-4">
                <h3 className="font-display font-semibold text-cjc-navy">Semester Clearance</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Start Date"
                    value={windowForm.semester_start_date}
                    onChange={(e) =>
                      setWindowForm((prev) => ({ ...prev, semester_start_date: e.target.value }))
                    }
                    helperText="Students can begin submitting from this date"
                  />
                  <Input
                    type="date"
                    label="Deadline"
                    value={windowForm.semester_deadline}
                    onChange={(e) =>
                      setWindowForm((prev) => ({ ...prev, semester_deadline: e.target.value }))
                    }
                    helperText="No new submissions after this date"
                  />
                </div>
                <ToggleSwitch
                  checked={windowForm.allow_semester_clearance}
                  onChange={(v) =>
                    setWindowForm((prev) => ({ ...prev, allow_semester_clearance: v }))
                  }
                  label="Allow Semester Clearance"
                  description="Enable or disable semester clearance submissions"
                />
              </div>

              <div className="flex justify-end">
                <Button variant="gold" isLoading={isSavingWindows} onClick={saveWindows}>
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 3: Status Overview (read-only) ─────────────────────── */}
          <TabsContent value="status">
            <div className="card p-6 space-y-3">
              <h3 className="font-display font-bold text-cjc-navy mb-4">
                Clearance Types — Current Status
              </h3>

              {statusRows.map((row) => {
                const days = daysUntil(row.deadline);
                const deadlinePassed = row.deadline
                  ? new Date(row.deadline) < new Date()
                  : false;

                return (
                  <div
                    key={row.label}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-gray-50 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={row.enabled ? "approved" : "neutral"} size="md">
                        {row.enabled ? "Open" : "Closed"}
                      </Badge>
                      <span className="text-sm font-medium text-cjc-navy">{row.label}</span>
                    </div>

                    <div className="flex flex-col sm:items-end gap-0.5 text-xs text-gray-500">
                      {row.start && (
                        <span>
                          Opens:{" "}
                          <span className="font-medium text-cjc-navy">
                            {new Date(row.start).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </span>
                      )}
                      {row.deadline && (
                        <span>
                          Deadline:{" "}
                          <span
                            className={cn(
                              "font-medium",
                              deadlinePassed ? "text-red-600" : "text-cjc-navy"
                            )}
                          >
                            {new Date(row.deadline).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {!deadlinePassed && days !== null && days >= 0 && (
                            <span className="text-amber-600 ml-1">({days}d left)</span>
                          )}
                          {deadlinePassed && (
                            <span className="text-red-500 ml-1">(passed)</span>
                          )}
                        </span>
                      )}
                      {!row.start && !row.deadline && (
                        <span className="italic">No window set — year-round</span>
                      )}
                    </div>
                  </div>
                );
              })}

              <p className="text-xs text-gray-400 pt-2">
                To change these values, go to the <strong>Clearance Windows</strong> tab.
              </p>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
