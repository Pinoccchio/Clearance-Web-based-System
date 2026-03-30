"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/Button";
import { GraduationCap } from "lucide-react";
import { createCourse, updateCourse, Course } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";

interface CourseFormData {
  name: string;
  code: string;
}

const emptyForm: CourseFormData = { name: "", code: "" };

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departmentId: string;
  mode?: "add" | "edit";
  course?: Course;
}

export function CourseFormModal({
  isOpen,
  onClose,
  onSuccess,
  departmentId,
  mode = "add",
  course,
}: CourseFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<CourseFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<CourseFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && course) {
        setFormData({ name: course.name, code: course.code });
      } else {
        setFormData(emptyForm);
      }
      setErrors({});
    }
  }, [isOpen, mode, course]);

  function validate(): boolean {
    const newErrors: Partial<CourseFormData> = {};
    if (!formData.name.trim()) newErrors.name = "Course name is required";
    if (!formData.code.trim()) newErrors.code = "Course code is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (mode === "edit" && course) {
        const updated = await updateCourse(course.id, {
          name: formData.name.trim(),
          code: formData.code.trim(),
        });
        showToast("success", "Course Updated", `${updated.name} has been updated.`);
      } else {
        const created = await createCourse({
          department_id: departmentId,
          name: formData.name.trim(),
          code: formData.code.trim(),
          status: "active",
        });
        showToast("success", "Course Added", `${created.name} has been added.`);
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save course";
      showToast("error", "Error", msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-cjc-red/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-cjc-red" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cjc-navy">
              {mode === "edit" ? "Edit Course" : "New Course"}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === "edit" ? "Update course details" : "Add a new course to your department"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cjc-navy mb-1.5">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="input-base"
              placeholder="e.g., BS Computer Science"
              autoFocus
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-cjc-navy mb-1.5">
              Course Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="input-base font-mono"
              placeholder="e.g., BSCS"
            />
            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="flex-1" isLoading={isLoading}>
              {mode === "edit" ? "Save Changes" : "Add Course"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
