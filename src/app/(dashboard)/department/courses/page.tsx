"use client";

import { useEffect, useState, useCallback } from "react";
import { GraduationCap, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import {
  getDepartmentByHeadId,
  getAllCoursesByDepartmentId,
  updateCourse,
  deleteCourse,
  Course,
  Department,
} from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CourseFormModal } from "@/components/features/CourseFormModal";

export default function DepartmentCoursesPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [department, setDepartment] = useState<Department | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const dept = await getDepartmentByHeadId(profile.id);
      if (!dept) {
        setError("You are not assigned as a department head.");
        setIsLoading(false);
        return;
      }
      setDepartment(dept);
      const data = await getAllCoursesByDepartmentId(dept.id);
      setCourses(data);
    } catch {
      setError("Failed to load courses.");
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtimeRefresh('courses', loadData);

  async function handleToggleStatus(course: Course) {
    const newStatus = course.status === "active" ? "inactive" : "active";
    try {
      const updated = await updateCourse(course.id, { status: newStatus });
      setCourses(prev => prev.map(c => c.id === course.id ? updated : c));
      showToast("success", "Status Updated", `${course.name} is now ${newStatus}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      showToast("error", "Error", msg);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCourse(deleteTarget.id);
      setCourses(prev => prev.filter(c => c.id !== deleteTarget.id));
      showToast("success", "Course Deleted", `${deleteTarget.name} has been deleted.`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete course";
      showToast("error", "Error", msg);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">Department</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">Courses</h1>
          </div>
        </header>
        <div className="p-6 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cjc-red/30 border-t-cjc-red rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-warm">
        <header className="bg-white border-b border-border-warm">
          <div className="px-6 py-5">
            <p className="text-sm text-warm-muted">Department</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">Courses</h1>
          </div>
        </header>
        <div className="p-6">
          <div className="card p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Header */}
      <header className="bg-white border-b border-border-warm">
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-warm-muted">{department?.name}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">Courses</h1>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cjc-red text-white rounded-lg hover:bg-cjc-red-light transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Course</span>
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Courses Table */}
        <div className="card overflow-x-auto">
          {courses.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-cjc-red/10 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-cjc-red" />
              </div>
              <h2 className="text-xl font-display font-bold text-cjc-navy mb-2">No Courses Yet</h2>
              <p className="text-warm-muted max-w-md mx-auto">
                Add courses offered by your department. Students will see these options when registering.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border-warm">
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider">
                    Course Name
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider hidden sm:table-cell">
                    Code
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-warm-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {courses.map(course => (
                  <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 lg:px-6 py-4 font-medium text-cjc-navy">
                          {course.name}
                        </td>
                        <td className="px-4 lg:px-6 py-4 font-mono text-gray-600 hidden sm:table-cell">
                          {course.code}
                        </td>
                        <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            course.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {course.status}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingCourse(course)}
                              className="p-2 hover:bg-surface-warm rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4 text-warm-muted" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(course)}
                              className={`p-1.5 rounded-md transition-colors ${
                                course.status === "active"
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-gray-400 hover:bg-gray-100"
                              }`}
                              title={course.status === "active" ? "Deactivate" : "Activate"}
                            >
                              {course.status === "active" ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteTarget(course)}
                              className="p-2 hover:bg-danger/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-danger" />
                            </button>
                          </div>
                        </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary */}
        {courses.length > 0 && (
          <p className="text-xs text-warm-muted px-1">
            {courses.filter(c => c.status === "active").length} active ·{" "}
            {courses.filter(c => c.status === "inactive").length} inactive · {courses.length} total
          </p>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
        variant="danger"
      />

      {department && (
        <CourseFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            loadData();
          }}
          departmentId={department.id}
        />
      )}

      {department && (
        <CourseFormModal
          isOpen={!!editingCourse}
          onClose={() => setEditingCourse(null)}
          onSuccess={() => {
            setEditingCourse(null);
            loadData();
          }}
          departmentId={department.id}
          mode="edit"
          course={editingCourse ?? undefined}
        />
      )}
    </div>
  );
}
