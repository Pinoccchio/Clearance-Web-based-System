"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Check } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  getDepartmentByHeadId,
  getAllCoursesByDepartmentId,
  createCourse,
  updateCourse,
  deleteCourse,
  Course,
  Department,
} from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface CourseFormData {
  name: string;
  code: string;
}

const emptyCourseForm: CourseFormData = { name: "", code: "" };

export default function DepartmentCoursesPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [department, setDepartment] = useState<Department | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<CourseFormData>(emptyCourseForm);
  const [addErrors, setAddErrors] = useState<Partial<CourseFormData>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CourseFormData>(emptyCourseForm);
  const [editErrors, setEditErrors] = useState<Partial<CourseFormData>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadData(profile.id);
    }
  }, [profile?.id]);

  async function loadData(userId: string) {
    setIsLoading(true);
    setError(null);
    try {
      const dept = await getDepartmentByHeadId(userId);
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
  }

  function validateForm(form: CourseFormData): Partial<CourseFormData> {
    const errs: Partial<CourseFormData> = {};
    if (!form.name.trim()) errs.name = "Course name is required";
    if (!form.code.trim()) errs.code = "Course code is required";
    return errs;
  }

  async function handleAdd() {
    const errs = validateForm(addForm);
    if (Object.keys(errs).length > 0) {
      setAddErrors(errs);
      return;
    }
    if (!department) return;
    setIsAdding(true);
    try {
      const created = await createCourse({
        department_id: department.id,
        name: addForm.name.trim(),
        code: addForm.code.trim(),
        status: "active",
      });
      setCourses(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setAddForm(emptyCourseForm);
      setShowAddForm(false);
      showToast("success", "Course Added", `${created.name} has been added.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add course";
      showToast("error", "Error", msg);
    } finally {
      setIsAdding(false);
    }
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setEditForm({ name: course.name, code: course.code });
    setEditErrors({});
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyCourseForm);
    setEditErrors({});
  }

  async function handleSaveEdit(courseId: string) {
    const errs = validateForm(editForm);
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateCourse(courseId, {
        name: editForm.name.trim(),
        code: editForm.code.trim(),
      });
      setCourses(prev =>
        prev.map(c => c.id === courseId ? updated : c).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      showToast("success", "Course Updated", `${updated.name} has been updated.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update course";
      showToast("error", "Error", msg);
    } finally {
      setIsSaving(false);
    }
  }

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
          <div className="w-8 h-8 border-2 border-ccis-blue-primary/30 border-t-ccis-blue-primary rounded-full animate-spin" />
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
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-warm-muted">{department?.name}</p>
            <h1 className="text-2xl font-display font-bold text-cjc-navy">Courses</h1>
          </div>
          <button
            onClick={() => { setShowAddForm(true); setAddErrors({}); setAddForm(emptyCourseForm); }}
            className="flex items-center gap-2 px-4 py-2 bg-ccis-blue-primary text-white rounded-lg hover:bg-ccis-blue transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {/* Add Course Form */}
        {showAddForm && (
          <div className="card p-5">
            <h3 className="font-semibold text-cjc-navy mb-4">New Course</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cjc-navy mb-1.5">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-base"
                  placeholder="e.g., BS Computer Science"
                />
                {addErrors.name && (
                  <p className="mt-1 text-xs text-red-500">{addErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-cjc-navy mb-1.5">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.code}
                  onChange={e => setAddForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="input-base font-mono"
                  placeholder="e.g., BSCS"
                />
                {addErrors.code && (
                  <p className="mt-1 text-xs text-red-500">{addErrors.code}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className="flex items-center gap-2 px-4 py-2 bg-ccis-blue-primary text-white rounded-lg hover:bg-ccis-blue transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isAdding ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Course
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Courses Table */}
        <div className="card overflow-hidden">
          {courses.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-ccis-blue-primary/10 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-ccis-blue-primary" />
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider">
                    Course Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-warm-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-warm-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {courses.map(course => (
                  <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                    {editingId === course.id ? (
                      <>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="input-base text-sm h-9"
                            autoFocus
                          />
                          {editErrors.name && (
                            <p className="mt-1 text-xs text-red-500">{editErrors.name}</p>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editForm.code}
                            onChange={e => setEditForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                            className="input-base text-sm h-9 font-mono w-28"
                          />
                          {editErrors.code && (
                            <p className="mt-1 text-xs text-red-500">{editErrors.code}</p>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            course.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {course.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(course.id)}
                              disabled={isSaving}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Save"
                            >
                              {isSaving ? (
                                <div className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-medium text-cjc-navy">
                          {course.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-600">
                          {course.code}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            course.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {course.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEdit(course)}
                              className="p-1.5 text-gray-500 hover:text-cjc-navy hover:bg-gray-100 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
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
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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
    </div>
  );
}
